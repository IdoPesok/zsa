import { z } from "zod"
import { NextRequest } from "./api"
import {
  TOnCompleteFn,
  TOnErrorFn,
  TOnStartFn,
  TOnSuccessFn,
} from "./callbacks"
import { TZSAError, ZSAError } from "./errors"
import { CompleteProcedure, TAnyCompleteProcedure } from "./procedure"
import {
  InputTypeOptions,
  RetryConfig,
  TAnyStateHandlerFunc,
  TAnyZodSafeFunctionHandler,
  TFinalInputSchema,
  TFinalOutputSchema,
  THandlerFunc,
  THandlerOpts,
  TInputSchemaFn,
  TInternals,
  TNoInputHandlerFunc,
  TOptsSource,
  TOutputSchemaFn,
  TSchemaInput,
  TSchemaOrZodUndefined,
  TSchemaOutput,
  TSchemaOutputOrUnknown,
  TShapeErrorFn,
  TShapeErrorNotSet,
  TStateHandlerFunc,
  TZodSafeFunctionDefaultOmitted,
  TimeoutStatus,
  ZSAResponseMeta,
} from "./types"
import {
  ZodTypeLikeVoid,
  canDataBeUndefinedForSchema,
  formDataToJson,
} from "./utils"

const validateOpts = (opts?: THandlerOpts<any>) => {
  // log if someone is trying to manipulate the opts
  // NOTE: even without this new check it is safe => no need for advisory because
  // - attacker can try to manipulate ctx but procedures will still run safely
  //     -> this is because the opts ctx always comes from procedure (check for isProcedure)
  // - schemas can't be returned (classes will be blocked)
  // - override input schema can't be passed in (classes will be blocked)
  // adding this to throw an auto not authorized error and an extra layer of protection can't hurt
  if (
    opts &&
    (!(opts.source instanceof TOptsSource) || !opts.source.validate())
  ) {
    throw new Error("Invalid opts, must originate from the server")
  }
}

/** A helper type to hold any zod safe function */
export interface TAnyZodSafeFunction
  extends ZodSafeFunction<any, any, any, any, any, boolean, any> {}

/** A helper type to wrap ZodSafeFunction in an Omit */
export type TZodSafeFunction<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
  TInputType extends InputTypeOptions,
> = Omit<
  ZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    TOmitted,
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  >,
  TOmitted
>

export class ZodSafeFunction<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
  TInputType extends InputTypeOptions,
> {
  /** The internals of the Zod Safe Function */
  public $internals: TInternals<
    TInputSchema,
    TOutputSchema,
    TError,
    TIsProcedure
  >

  constructor(
    internals: TInternals<TInputSchema, TOutputSchema, TError, TIsProcedure>
  ) {
    this.$internals = internals
  }

  /** Check if the timeout has triggered, if so, throw a ZSAError */
  public checkTimeoutStatus(timeoutStatus: TimeoutStatus) {
    if (timeoutStatus.isTimeout) {
      throw new ZSAError(
        "TIMEOUT",
        `Exceeded timeout of ${this.$internals.timeout} ms`
      )
    }
  }

  /**
   *
   * Get the retry delay for the current retry attempt
   *
   * If there should be no retry, returns -1
   */
  public getRetryDelay($err: unknown, currentAttempt: number) {
    try {
      const err = $err instanceof ZSAError ? $err : new ZSAError("ERROR", $err)

      // don't retry on timeouts
      if (err.code === "TIMEOUT") {
        return -1
      }

      // if there is no retry config, return -1
      const config = this.$internals.retryConfig
      if (!config) return -1

      // if this is a procedure, the action should retry
      if (this.$internals.isProcedure) return -1

      const shouldRetry = currentAttempt < config.maxAttempts

      let retryDelay = 0
      if (typeof config.delay === "function") {
        retryDelay = config.delay(currentAttempt, err)
      } else if (typeof config.delay === "number") {
        retryDelay = config.delay
      }

      if (shouldRetry) return retryDelay
      return -1
    } catch {
      return -1
    }
  }

  /**
   *  Run through the procedure chain and get the final context
   */
  public async getProcedureChainOutput($args: {
    args: TSchemaInput<TInputSchema>
    timeoutStatus: TimeoutStatus
    request: NextRequest | undefined
    responseMeta: ZSAResponseMeta | undefined
    onInputSchema?: (schema: z.ZodType | undefined) => void
    previousState?: any
  }): Promise<TProcedureChainOutput> {
    const {
      args,
      timeoutStatus,
      request,
      responseMeta,
      onInputSchema,
      previousState,
    } = $args

    let accData = undefined
    let inputSchema: z.ZodType | undefined = undefined

    for (let i = 0; i < this.$internals.procedureHandlerChain.length; i += 1) {
      this.checkTimeoutStatus(timeoutStatus)

      const procedureHandler = this.$internals.procedureHandlerChain[i]!
      const [data, err] = await procedureHandler(args, undefined, {
        ctx: accData,
        request,
        responseMeta,
        previousState,
        source: new TOptsSource(() => true),
        previousInputSchema: inputSchema,
        onInputSchema: (schema) => {
          inputSchema = schema
        },
      })

      if (err) {
        throw err
      }

      // update the accumulated data
      accData = data as any
    }

    onInputSchema?.(inputSchema)

    return accData as any
  }

  /**
   *  Run through the procedure chain and get the final static input schema
   */
  public async getFinalStaticInputSchema(args: {
    opts?: THandlerOpts<TProcedureChainOutput>
  }): Promise<TProcedureChainOutput> {
    if (this.$internals.isProcedure) {
      return await this.evaluateInputSchema({
        ctx: undefined as any,
        opts: args.opts,
        noFunctionsAllowed: true,
      })
    }

    let inputSchema: z.ZodType | undefined = undefined

    for (const procedureHandler of this.$internals.procedureHandlerChain) {
      await procedureHandler(undefined, undefined, {
        source: new TOptsSource(() => true),
        previousInputSchema: inputSchema,
        returnInputSchema: true,
        onInputSchema: (schema) => {
          inputSchema = schema
        },
      })
    }

    if (!args.opts) {
      args.opts = {
        source: new TOptsSource(() => true),
      }
    }

    // set the final previous input schema
    args.opts.previousInputSchema = inputSchema

    // evaluate the final input schema
    return ((await this.evaluateInputSchema({
      ctx: undefined as any,
      opts: args.opts,
      noFunctionsAllowed: true,
    })) || z.undefined()) as any
  }

  /** set a timeout on the server action */
  public timeout<T extends number>(
    milliseconds: T
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    TOmitted | "timeout",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      timeout: milliseconds,
    }) as any
  }

  /** set a retry mechanism on the server action */
  public retry(
    config: RetryConfig
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    TOmitted | "retry",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      retryConfig: config,
    }) as any
  }

  /**
   * set the input schema for the server action
   *
   * @example
   * ```ts
   * .input(z.object({
   *   message: z.string()
   * }))
   * ```
   */
  public input<
    T extends z.ZodType | TInputSchemaFn<TInputSchema, TProcedureChainOutput>,
    TType extends TIsProcedure extends false
      ? InputTypeOptions
      : "json" = "json",
  >(
    schema: T,
    opts?: {
      type?: TType
    }
  ): TZodSafeFunction<
    TInputSchema extends z.ZodType
      ? z.ZodIntersection<TInputSchema, TFinalInputSchema<T>>
      : TFinalInputSchema<T>,
    TOutputSchema,
    TError,
    "input" | Exclude<TOmitted, "onInputParseError">, // bring back the onInputParseError
    TProcedureChainOutput,
    TIsProcedure,
    TType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      // @ts-expect-error
      inputSchema: schema,
      inputType: opts?.type,
    }) as any
  }

  /** set the output schema for the server action */
  public output<T extends z.ZodType | TOutputSchemaFn<TProcedureChainOutput>>(
    schema: T
  ): TZodSafeFunction<
    TInputSchema,
    TFinalOutputSchema<T>,
    TError,
    "output" | Exclude<TOmitted, "onOutputParseError">,
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      // @ts-expect-error
      outputSchema: schema,
    }) as any
  }

  /** set a handler function for input parse errors */
  public onInputParseError(
    fn: (
      err: z.ZodError<
        TIsProcedure extends false ? TSchemaOrZodUndefined<TInputSchema> : any
      >
    ) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    "onInputParseError" | TOmitted,
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      onInputParseError: fn as any,
    }) as any
  }

  /** set a handler function for output parse errors */
  public onOutputParseError(
    fn: (
      err: z.ZodError<
        TIsProcedure extends false
          ? TOutputSchema extends z.ZodType
            ? TOutputSchema
            : any
          : any
      >
    ) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    "onOutputParseError" | TOmitted,
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    // @ts-expect-error
    return new ZodSafeFunction({
      ...this.$internals,
      onOutputParseError: fn,
    }) as any
  }

  /** set a handler function for errors */
  public onError(
    fn: TOnErrorFn<TError, TIsProcedure>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    "onError" | TOmitted,
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      onErrorFns: [...(this.$internals.onErrorFns || []), fn],
    }) as any
  }

  /** set a handler function for when the server action starts */
  public onStart(
    fn: TOnStartFn<TInputSchema, TIsProcedure>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    TOmitted | "onStart",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      onStartFns: [...(this.$internals.onStartFns || []), fn],
    }) as any
  }

  /** set a handler function for when the server action succeeds */
  public onSuccess(
    fn: TOnSuccessFn<TInputSchema, TOutputSchema, TIsProcedure>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    TOmitted | "onSuccess",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      onSuccessFns: [...(this.$internals.onSuccessFns || []), fn],
    }) as any
  }

  /** set a handler function for when the server action completes (success or error) */
  public onComplete(
    fn: TOnCompleteFn<TInputSchema, TOutputSchema, TError, TIsProcedure>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TError,
    TOmitted | "onComplete",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      onCompleteFns: [...(this.$internals.onCompleteFns || []), fn],
    }) as any
  }

  /** a helper function to parse output data given the active output schema */
  public async parseOutputData(
    data: any,
    ctx: TProcedureChainOutput,
    timeoutStatus: TimeoutStatus,
    opts?: THandlerOpts<any>
  ): Promise<TSchemaOutputOrUnknown<TOutputSchema>> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    // no output schema, return data
    if (!this.$internals.outputSchema) return data

    const schema =
      typeof this.$internals.outputSchema === "function"
        ? await this.$internals.outputSchema({
            ctx,
            unparsedData: data,
            request: opts?.request,
            responseMeta: opts?.responseMeta,
            previousState: opts?.previousState,
          })
        : this.$internals.outputSchema

    if (!(schema instanceof z.ZodType)) {
      throw new ZSAError("ERROR", "Output schema must be a ZodType")
    }

    const safe = await schema.safeParseAsync(data)
    if (!safe.success) {
      if (this.$internals.onOutputParseError) {
        await this.$internals.onOutputParseError(safe.error)
      }

      const flattenedErrors = safe.error.flatten()
      const formattedErrors = safe.error.format()

      throw new ZSAError("OUTPUT_PARSE_ERROR", safe.error, {
        outputParseErrors: {
          fieldErrors: flattenedErrors?.fieldErrors,
          formErrors: flattenedErrors?.formErrors,
          formattedErrors: formattedErrors,
        },
      })
    }
    return safe.data
  }

  /** helper function to handle start with timeout checkpoints */
  public async handleStart(args: any, timeoutStatus: TimeoutStatus) {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    // callbacks run on the main action thread
    if (this.$internals.isProcedure) return

    for (const fn of this.$internals.onStartFns || []) {
      await fn({ args })
      this.checkTimeoutStatus(timeoutStatus) // checkpoint
    }
  }

  /** helper function to handle success with timeout checkpoints */
  public async handleSuccess(
    args: any,
    data: any,
    timeoutStatus: TimeoutStatus
  ) {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    // callbacks run on the main action thread
    if (this.$internals.isProcedure) return

    // run on success callbacks
    for (const fn of this.$internals.onSuccessFns || []) {
      await fn({ args, data })
      this.checkTimeoutStatus(timeoutStatus) // checkpoint
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    // run on complete callbacks
    for (const fn of this.$internals.onCompleteFns || []) {
      await fn({
        isSuccess: true,
        isError: false,
        status: "success",
        args,
        data,
      })
      this.checkTimeoutStatus(timeoutStatus) // checkpoint
    }
  }

  /** helper function to handle errors with timeout checkpoints */
  public async handleError(
    err: any,
    inputRaw: any,
    inputParsed: any
  ): Promise<[null, TZSAError<TInputSchema>]> {
    // we need to throw any NEXT_REDIRECT errors so that next can
    // properly handle them.

    if (err.message === "NEXT_REDIRECT" || err.message === "NEXT_NOT_FOUND") {
      throw err
    }

    // callbacks run on the main action thread
    // error will get returned at the action level
    if (this.$internals.isProcedure) return [null, err as any]

    let customError

    if (this.$internals.shapeErrorFns !== undefined) {
      let accData = undefined
      for (const fn of this.$internals.shapeErrorFns) {
        accData = await fn({
          err,
          typedData: {
            // @ts-expect-error
            inputParseErrors:
              err instanceof ZSAError ? err.inputParseErrors : undefined,
            // @ts-expect-error
            outputParseErrors:
              err instanceof ZSAError ? err.outputParseErrors : undefined,
            inputParsed: inputParsed,
            inputRaw: inputRaw,
          },
          ctx: accData,
        })
      }
      customError = accData as any
    } else {
      customError = err instanceof ZSAError ? err : new ZSAError("ERROR", err)
    }

    // run on error callbacks
    for (const fn of this.$internals.onErrorFns || []) {
      await fn(customError)
    }

    // run on complete callbacks
    for (const fn of this.$internals.onCompleteFns || []) {
      await fn({
        isSuccess: false,
        isError: true,
        status: "error",
        error: customError,
      })
    }

    if (this.$internals.shapeErrorFns !== undefined) {
      return [null, customError as any]
    }

    const stringifyIfNeeded = (data: any) =>
      typeof data === "string" ? data : JSON.stringify(data)

    // get zod errors
    let formattedErrors
    let flattenedErrors
    const data = err.data
    if (
      data instanceof z.ZodError &&
      customError.code === "INPUT_PARSE_ERROR"
    ) {
      formattedErrors = data.format()
      flattenedErrors = data.flatten()
    }

    // finally return the error
    return [
      null,
      {
        data: stringifyIfNeeded(customError.data),
        name: customError.name,
        message: stringifyIfNeeded(customError.message),
        code: customError.code,
        fieldErrors: flattenedErrors?.fieldErrors,
        formErrors: flattenedErrors?.formErrors,
        formattedErrors: formattedErrors as any,
      } as any,
    ]
  }

  public async evaluateInputSchema(args: {
    ctx: TProcedureChainOutput
    opts?: THandlerOpts<TProcedureChainOutput>
    noFunctionsAllowed?: boolean
  }): Promise<TSchemaOutput<TInputSchema>> {
    const { ctx, opts, noFunctionsAllowed } = args

    // evaluate the input schema
    let inputSchema = opts?.overrideInputSchema || this.$internals.inputSchema

    if (noFunctionsAllowed && typeof inputSchema === "function") {
      throw new Error("Input functions are not suppported yet")
    }

    if (typeof inputSchema === "function") {
      inputSchema = await inputSchema({
        ctx,
        previousSchema: opts?.previousInputSchema || z.undefined(),
        request: opts?.request,
        responseMeta: opts?.responseMeta,
        previousState: opts?.previousState,
      })
    }

    if (inputSchema && !(inputSchema instanceof z.ZodType)) {
      throw new ZSAError("ERROR", "Input schema must be a ZodType")
    }

    let final

    if (!opts?.previousInputSchema) {
      // if there is no previous input schema, return current schema
      final = inputSchema
    } else if (!inputSchema) {
      // if there is no current schema, return previous schema
      final = opts.previousInputSchema
    } else {
      // if there is both a previous and current schema, return the intersection
      final = opts.previousInputSchema.and(inputSchema)
    }

    // send the input schema back to the chain handler
    opts?.onInputSchema?.(final as any)

    return (final || z.undefined()) as any
  }

  /** helper function to parse input data given the active input schema */
  public async parseInputData(
    $data: any,
    overrideData: any,
    timeoutStatus: TimeoutStatus,
    ctx: TProcedureChainOutput,
    opts?: THandlerOpts<TProcedureChainOutput>
  ): Promise<TSchemaOutput<TInputSchema>> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    const inputSchema = await this.evaluateInputSchema({
      ctx,
      opts,
    })

    let data = $data

    // if data is formData, convert it to json
    if ($data instanceof FormData && this.$internals.inputType !== "json") {
      data = {
        ...formDataToJson(data, inputSchema),
        ...(this.$internals.inputType !== "state" ? overrideData || {} : {}),
      }
    }

    // if its an empty object, set it to undefined if reasonable
    const canChangeToUndefined =
      ($data instanceof FormData || opts?.isFromOpenApiHandler) &&
      canDataBeUndefinedForSchema(inputSchema)

    // edge case for openapi handlers where the input is an empty object
    if (
      canChangeToUndefined &&
      data &&
      typeof data === "object" &&
      Object.keys(data).length === 0
    ) {
      data = undefined
    }

    opts?.onArgs?.(data)

    // we got data, handle start
    await this.handleStart(data, timeoutStatus)

    // WEIRD CASE
    // the procedure input schema is undefined but the action input schema is not
    // thus if we try to parse z.undefined(object) we get an error
    // we can safely skip this because it will get validated by the action
    if (
      !this.$internals.inputSchema &&
      data !== undefined &&
      this.$internals.isProcedure
    ) {
      return undefined as any
    }

    // parse the input data
    const safe = await inputSchema.safeParseAsync(data)

    if (!safe.success) {
      // call the input parse error callbacks
      if (this.$internals.onInputParseError) {
        await this.$internals.onInputParseError(safe.error)
      }

      // retrieve the zod errors
      const flattenedErrors = safe.error.flatten()
      const formattedErrors = safe.error.format()

      // throw the error
      throw new ZSAError("INPUT_PARSE_ERROR", safe.error, {
        inputParseErrors: {
          fieldErrors: flattenedErrors?.fieldErrors,
          formErrors: flattenedErrors?.formErrors,
          formattedErrors: formattedErrors,
        },
      })
    }

    return safe.data
  }

  /** set a handler function for when the server action starts */
  public experimental_shapeError<T extends TShapeErrorFn<TError>>(
    fn: T
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    Awaited<ReturnType<T>>,
    TOmitted | "experimental_shapeError",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      // @ts-expect-error
      shapeErrorFns: [...(this.$internals.shapeErrorFns || []), fn],
    }) as any
  }

  public getTimeoutErrorPromise = (timeoutMs: number) =>
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ZSAError("TIMEOUT", `Exceeded timeout of ${timeoutMs} ms`))
      }, timeoutMs)
    })

  /** set the handler function for the server action */
  public handler<
    TRet extends TOutputSchema extends z.ZodType
      ? TOutputSchema["_output"] | Promise<TOutputSchema["_output"]>
      : any | Promise<any>,
  >(
    fn: (v: {
      /** the parsed input to the action */
      input: TSchemaOutput<TInputSchema>
      /** the final context of the action */
      ctx: TProcedureChainOutput
      /** a request object if the action is run from an Open API route `createOpenApiServerActionRouter` */
      request?: NextRequest
      /** an object containing response metadata for OpenAPI handlers */
      responseMeta?: ZSAResponseMeta
      /** the previous state when inputType is "state" */
      previousState: any
    }) => TRet
  ): TIsProcedure extends false
    ? TInputType extends "state"
      ? TStateHandlerFunc<TInputSchema, TOutputSchema, TError, TRet>
      : TInputSchema extends undefined | ZodTypeLikeVoid
        ? TNoInputHandlerFunc<
            TRet,
            undefined,
            TOutputSchema,
            TError,
            TProcedureChainOutput,
            TIsProcedure
          >
        : THandlerFunc<
            TInputSchema,
            TOutputSchema,
            TError,
            TRet,
            TProcedureChainOutput,
            TInputType,
            TIsProcedure
          >
    : CompleteProcedure<
        TInputSchema,
        THandlerFunc<
          TInputSchema,
          TOutputSchema,
          TError,
          TRet,
          TProcedureChainOutput,
          "json",
          TIsProcedure
        >,
        TError
      > {
    // keep state of the timeout
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    // type of args
    type TArgs = TInputType extends "json"
      ? TSchemaInput<TInputSchema>
      : FormData

    const wrapper = async (
      $args: TArgs,
      overrideArgs?: Partial<TSchemaInput<TInputSchema>>,
      opts?: THandlerOpts<TProcedureChainOutput>
    ): Promise<any> => {
      // make sure the opts came from the server
      validateOpts(opts)

      /**
       * helper opts to generate openapi docs
       * for the action schemas
       */
      if (opts?.returnInputSchema) {
        // compute the final static input schema
        return await this.getFinalStaticInputSchema({
          opts,
        })
      } else if (opts?.returnOutputSchema) {
        // return a static output schema
        if (typeof this.$internals.outputSchema === "function") {
          throw new Error(
            "Cannot return output schema from a function output schema"
          )
        }
        // return the output schema
        return this.$internals.outputSchema
      }

      let args
      let parsedArgs

      if (this.$internals.inputType === "state") {
        // the second argument is the form data
        args = overrideArgs
      } else {
        args = $args
      }

      let previousState = opts?.previousState || undefined

      // get the previous state (if it exists)
      if (
        this.$internals.inputType === "state" &&
        !this.$internals.isProcedure
      ) {
        previousState = $args // the first argument is the previous state
      }

      try {
        // run the procedure chain to get the context
        let ctx

        if (this.$internals.isProcedure && opts) {
          // ctx is from the procedure chain
          ctx = opts.ctx as TProcedureChainOutput
        } else {
          // get ctx by evaluating the procedure chain
          ctx = await this.getProcedureChainOutput({
            // @ts-expect-error
            args,
            timeoutStatus,
            request: opts?.request,
            responseMeta: opts?.responseMeta,
            onInputSchema: (schema) => {
              if (!opts) {
                // make sure opts is not undefined
                opts = {
                  source: new TOptsSource(() => true),
                }
              }

              // set the previous input schema to the evaluated
              // schema from the procedure chain
              opts.previousInputSchema = schema
            },
            previousState,
          })
        }

        // parse the input data
        const input = await this.parseInputData(
          args,
          overrideArgs,
          timeoutStatus,
          ctx,
          opts
        )

        // send on parsed args
        opts?.onParsedArgs?.(input)

        // update the parsed args (used in errors)
        parsedArgs = input

        // timeout checkpoint
        this.checkTimeoutStatus(timeoutStatus) // checkpoint

        // call the handler!
        const data = await fn({
          input,
          ctx,
          request: opts?.request,
          responseMeta: opts?.responseMeta,
          previousState,
        })

        // parse the output data
        const parsed = await this.parseOutputData(
          data,
          ctx,
          timeoutStatus,
          opts
        )

        await this.handleSuccess(input, parsed, timeoutStatus)

        return [parsed, null]
      } catch (err) {
        const retryDelay = this.getRetryDelay(err, opts?.attempts || 1)

        if (retryDelay >= 0) {
          await new Promise((r) => setTimeout(r, retryDelay))
          return await wrapper($args, overrideArgs, {
            ...(opts || {}),
            attempts: (opts?.attempts || 1) + 1,
            source: new TOptsSource(() => true),
          })
        }

        return await this.handleError(err, args, parsedArgs)
      }
    }

    // helper function to run a Promise race between the timeout and the wrapper
    const withTimeout = async (
      args: TArgs,
      overrideArgs?: Partial<TSchemaInput<TInputSchema>>,
      opts?: THandlerOpts<TProcedureChainOutput>
    ) => {
      const timeoutMs = this.$internals.timeout
      if (!timeoutMs) return await wrapper(args, overrideArgs, opts)

      validateOpts(opts)

      let gotArgs: any = undefined
      let gotParsedArgs: any = undefined

      return await Promise.race([
        wrapper(args, overrideArgs, {
          ...(opts || {}),
          onArgs: (args) => {
            gotArgs = args
          },
          onParsedArgs: (parsedArgs) => {
            gotParsedArgs = parsedArgs
          },
          source: new TOptsSource(() => true),
        }),
        this.getTimeoutErrorPromise(timeoutMs),
      ])
        .then((r) => r)
        .catch((err) => {
          timeoutStatus.isTimeout = true
          return this.handleError(err, gotArgs, gotParsedArgs)
        })
    }

    // if this is a procedure, we need to return the complete procedure
    if (this.$internals.isProcedure) {
      const handler = this.$internals.timeout ? withTimeout : wrapper

      return new CompleteProcedure({
        inputSchema: this.$internals.inputSchema,
        handlerChain: [...this.$internals.procedureHandlerChain, handler],
        shapeErrorFns: this.$internals.shapeErrorFns,
        lastHandler: handler,
        onCompleteFns: this.$internals.onCompleteFns,
        onErrorFns: this.$internals.onErrorFns,
        onStartFns: this.$internals.onStartFns,
        onSuccessFns: this.$internals.onSuccessFns,
        timeout: this.$internals.timeout,
        retryConfig: this.$internals.retryConfig,
      }) as any
    }

    // if there is a timeout, use withTimeout
    if (this.$internals.timeout) {
      return withTimeout as any
    }

    return wrapper as any
  }
}

// helper function to create a properly typed zod safe function
export function createZodSafeFunction<TIsProcedure extends boolean>(
  isProcedure?: TIsProcedure,
  parentProcedure?: TAnyCompleteProcedure
): TZodSafeFunction<
  undefined,
  undefined,
  TShapeErrorNotSet,
  TZodSafeFunctionDefaultOmitted,
  undefined,
  TIsProcedure,
  "json"
> {
  return new ZodSafeFunction({
    inputSchema: parentProcedure?.$internals.inputSchema || undefined,
    outputSchema: undefined,
    shapeErrorFns: parentProcedure?.$internals.shapeErrorFns || undefined,
    isChained: parentProcedure !== undefined,
    isProcedure: isProcedure === true,
    procedureHandlerChain: parentProcedure?.$internals.handlerChain || [],
    onCompleteFns: parentProcedure?.$internals.onCompleteFns,
    onErrorFns: parentProcedure?.$internals.onErrorFns,
    onStartFns: parentProcedure?.$internals.onStartFns,
    onSuccessFns: parentProcedure?.$internals.onSuccessFns,
  }) as any
}

// helper type to infer the return data of a server action
export type inferServerActionReturnData<
  TAction extends TAnyZodSafeFunctionHandler | TAnyStateHandlerFunc,
> =
  NonNullable<Awaited<ReturnType<TAction>>[0]> extends never
    ? undefined
    : NonNullable<Awaited<ReturnType<TAction>>[0]>

// helper type to infer the error of a server action
export type inferServerActionError<
  TAction extends TAnyZodSafeFunctionHandler | TAnyStateHandlerFunc,
> = NonNullable<Awaited<ReturnType<TAction>>[1]>

// helper type to infer the return type of a server action
export type inferServerActionReturnType<
  TAction extends TAnyZodSafeFunctionHandler | TAnyStateHandlerFunc,
> = Awaited<ReturnType<TAction>>

// helper type to infer the return type of a server action
// hot promise
export type inferServerActionReturnTypeHot<
  TAction extends TAnyZodSafeFunctionHandler | TAnyStateHandlerFunc,
> = ReturnType<TAction>

// helper type to infer the input of a server action
export type inferServerActionInput<
  TAction extends TAnyZodSafeFunctionHandler | TAnyStateHandlerFunc,
> = TAction extends TAnyZodSafeFunctionHandler
  ? Parameters<TAction>[0]
  : [Parameters<TAction>[0], Parameters<TAction>[1]]

// create a server action without a procedure
export function createServerAction(): TZodSafeFunction<
  undefined,
  undefined,
  TShapeErrorNotSet,
  TZodSafeFunctionDefaultOmitted,
  undefined,
  false,
  "json"
> {
  return new ZodSafeFunction({
    inputSchema: undefined,
    outputSchema: undefined,
    shapeErrorFns: undefined,
    procedureHandlerChain: [],
  }) as any
}
