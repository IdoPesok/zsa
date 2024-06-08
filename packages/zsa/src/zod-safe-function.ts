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
  TAnyZodSafeFunctionHandler,
  THandlerFunc,
  THandlerOpts,
  TInternals,
  TNoInputHandlerFunc,
  TOptsSource,
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
  // even without this check it is safe => no need for advisory because
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
  public async getProcedureChainOutput(
    args: TSchemaInput<TInputSchema>,
    timeoutStatus: TimeoutStatus,
    request: NextRequest | undefined,
    responseMeta: ZSAResponseMeta | undefined,
    previousState?: any
  ): Promise<TProcedureChainOutput> {
    let accData = undefined

    for (let i = 0; i < this.$internals.procedureHandlerChain.length; i += 1) {
      this.checkTimeoutStatus(timeoutStatus)

      const procedureHandler = this.$internals.procedureHandlerChain[i]!
      const [data, err] = await procedureHandler(args, undefined, {
        ctx: accData,
        request,
        responseMeta,
        previousState,
        source: new TOptsSource(() => true),
      })
      if (err) {
        throw err
      }

      // update the accumulated data
      accData = data as any
    }

    return accData as any
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
    T extends z.ZodType,
    TType extends TIsProcedure extends false
      ? InputTypeOptions
      : "json" = "json",
  >(
    schema: T,
    opts?: {
      type?: TType
    }
  ): TZodSafeFunction<
    TInputSchema extends z.ZodType ? z.ZodIntersection<TInputSchema, T> : T,
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
      inputSchema: !this.$internals.inputSchema
        ? schema
        : schema.and(this.$internals.inputSchema),
      inputType: opts?.type,
    }) as any
  }

  /** set the output schema for the server action */
  public output<T extends z.ZodType>(
    schema: T
  ): TZodSafeFunction<
    TInputSchema,
    T,
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
    // @ts-expect-error
    return new ZodSafeFunction({
      ...this.$internals,
      onInputParseError: fn,
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
    timeoutStatus: TimeoutStatus
  ): Promise<TSchemaOutputOrUnknown<TOutputSchema>> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    // no output schema, return data
    if (!this.$internals.outputSchema) return data

    const safe = await this.$internals.outputSchema.safeParseAsync(data)
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

    // callbacks run on the main action thread
    // error will get returned at the action level
    if (this.$internals.isProcedure) return [null, customError as any]

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

  /** helper function to parse input data given the active input schema */
  public async parseInputData(
    data: any,
    timeoutStatus: TimeoutStatus,
    $overrideInputSchema?: z.ZodType
  ): Promise<TSchemaOutput<TInputSchema>> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    // get the input schema
    const inputSchema = $overrideInputSchema || this.$internals.inputSchema

    // WEIRD CASE
    // the procedure input schema is undefined but the action input schema is not
    // thus if we try to parse z.undefined(object) we get an error
    // we can safely skip this because it will get validated by the action
    if (!inputSchema && data !== undefined && this.$internals.isProcedure) {
      return data
    }

    // parse the input data
    const safe = await (inputSchema || z.undefined()).safeParseAsync(data)

    if (!safe.success) {
      if (this.$internals.onInputParseError) {
        await this.$internals.onInputParseError(safe.error)
      }

      const flattenedErrors = safe.error.flatten()
      const formattedErrors = safe.error.format()

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
  public shapeError<T extends TShapeErrorFn<TError>>(
    fn: T
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    Awaited<ReturnType<T>>,
    TOmitted | "shapeError",
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      // @ts-expect-error
      shapeErrorFn: fn,
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
      validateOpts(opts)

      if (opts?.returnInputSchema) {
        // return the input schema
        return this.$internals.inputSchema || z.undefined()
      } else if (opts?.returnOutputSchema) {
        // return the output schema
        return this.$internals.outputSchema
      }

      let args
      let parsedArgs

      if (this.$internals.inputType === "state") {
        args = overrideArgs // the second argument is the form data
      } else {
        args = $args
      }

      let previousState = opts?.previousState || undefined

      if (
        this.$internals.inputType === "state" &&
        !this.$internals.isProcedure
      ) {
        previousState = $args // the first argument is the previous state
      }

      try {
        // if args is formData
        if (args instanceof FormData) {
          args = {
            ...formDataToJson(
              args,
              this.$internals.inputSchema || z.undefined()
            ),
            ...(this.$internals.inputType !== "state"
              ? overrideArgs || {}
              : {}),
          }

          if (
            Object.keys(args).length === 0 &&
            canDataBeUndefinedForSchema(this.$internals.inputSchema)
          ) {
            args = undefined
          }
        }

        opts?.onArgs?.(args)

        await this.handleStart(args, timeoutStatus)

        // run the procedure chain to get the context
        const ctx =
          this.$internals.isProcedure && opts
            ? (opts.ctx as TProcedureChainOutput)
            : await this.getProcedureChainOutput(
                // @ts-expect-error
                args,
                timeoutStatus,
                opts?.request,
                opts?.responseMeta,
                previousState
              )

        // parse the input data
        const input = await this.parseInputData(
          args,
          timeoutStatus,
          opts?.overrideInputSchema
        )

        opts?.onParsedArgs?.(input)

        parsedArgs = input

        // timeout checkpoint
        this.checkTimeoutStatus(timeoutStatus) // checkpoint

        const data = await fn({
          input,
          ctx,
          request: opts?.request,
          responseMeta: opts?.responseMeta,
          previousState,
        })

        const parsed = await this.parseOutputData(data, timeoutStatus)

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
    shapeErrorFns: undefined,
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
  TAction extends TAnyZodSafeFunctionHandler,
> =
  NonNullable<Awaited<ReturnType<TAction>>[0]> extends never
    ? undefined
    : NonNullable<Awaited<ReturnType<TAction>>[0]>

// helper type to infer the error of a server action
export type inferServerActionError<TAction extends TAnyZodSafeFunctionHandler> =
  NonNullable<Awaited<ReturnType<TAction>>[1]>

// helper type to infer the return type of a server action
export type inferServerActionReturnType<
  TAction extends TAnyZodSafeFunctionHandler,
> = Awaited<ReturnType<TAction>>

// helper type to infer the return type of a server action
// hot promise
export type inferServerActionReturnTypeHot<
  TAction extends TAnyZodSafeFunctionHandler,
> = ReturnType<TAction>

// helper type to infer the input of a server action
export type inferServerActionInput<TAction extends TAnyZodSafeFunctionHandler> =
  Parameters<TAction>[0]

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
