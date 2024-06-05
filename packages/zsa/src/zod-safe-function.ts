import { z } from "zod"
import { NextRequest } from "./api"
import { TOnCompleteFn, TOnStartFn, TOnSuccessFn } from "./callbacks"
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
  TShapeErrorFn,
  TStateHandlerFunc,
  TZodIntersection,
  TZodSafeFunctionDefaultOmitted,
  TimeoutStatus,
  ZSAResponseMeta,
} from "./types"
import { formDataToJson } from "./utils"

/** A helper type to hold any zod safe function */
export interface TAnyZodSafeFunction
  extends ZodSafeFunction<any, any, any, any, any, boolean, any> {}

/** A helper type to wrap ZodSafeFunction in an Omit */
export type TZodSafeFunction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
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
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TError extends any,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
  TInputType extends InputTypeOptions,
> {
  /** The internals of the Zod Safe Function */
  public $internals: TInternals<TInputSchema, TOutputSchema, TIsProcedure>

  constructor(
    internals: TInternals<TInputSchema, TOutputSchema, TIsProcedure>
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
    args: TInputSchema["_input"],
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
    TZodIntersection<TInputSchema, T>,
    TOutputSchema,
    TError extends TZSAError<z.ZodUndefined>
      ? TZSAError<TZodIntersection<TInputSchema, T>>
      : TError,
    "input" | Exclude<TOmitted, "onInputParseError">, // bring back the onInputParseError
    TProcedureChainOutput,
    TIsProcedure,
    TType
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      // @ts-expect-error
      inputSchema:
        this.$internals.inputSchema instanceof z.ZodUndefined
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
      err: z.ZodError<TIsProcedure extends false ? TInputSchema : any>
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
      onInputParseError: fn,
    }) as any
  }

  /** set a handler function for output parse errors */
  public onOutputParseError(
    fn: (
      err: z.ZodError<TIsProcedure extends false ? TOutputSchema : any>
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
    return new ZodSafeFunction({
      ...this.$internals,
      onOutputParseError: fn,
    }) as any
  }

  /** set a handler function for errors */
  public onError(
    fn: (err: unknown) => any
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
      onErrorFn: fn,
    }) as any
  }

  /** set a handler function for when the server action starts */
  public shapeError<T extends TShapeErrorFn>(
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
      shapeErrorFn: fn,
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
      onStartFn: fn,
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
      onSuccessFn: fn,
    }) as any
  }

  /** set a handler function for when the server action completes (success or error) */
  public onComplete(
    fn: TOnCompleteFn<TInputSchema, TOutputSchema, TIsProcedure>
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
      onCompleteFn: fn,
    }) as any
  }

  /** a helper function to parse output data given the active output schema */
  public async parseOutputData(
    data: any,
    timeoutStatus: TimeoutStatus
  ): Promise<TOutputSchema["_output"]> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint
    if (
      !this.$internals.outputSchema ||
      this.$internals.outputSchema instanceof z.ZodUndefined
    )
      return data
    const safe = await this.$internals.outputSchema.safeParseAsync(data)
    if (!safe.success) {
      if (this.$internals.onOutputParseError) {
        await this.$internals.onOutputParseError(safe.error)
      }
      safe.error.flatten()
      throw new ZSAError("OUTPUT_PARSE_ERROR", safe.error)
    }
    return safe.data
  }

  /** helper function to handle start with timeout checkpoints */
  public async handleStart(args: any, timeoutStatus: TimeoutStatus) {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (
      this.$internals.onStartFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onStartFromProcedureFn({
        args,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$internals.onStartFn && !this.$internals.isProcedure) {
      await this.$internals.onStartFn({
        args,
      })
    }
  }

  /** helper function to handle success with timeout checkpoints */
  public async handleSuccess(
    args: any,
    data: any,
    timeoutStatus: TimeoutStatus
  ) {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (
      this.$internals.onSuccessFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onSuccessFromProcedureFn({
        args,
        data,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$internals.onSuccessFn && !this.$internals.isProcedure) {
      await this.$internals.onSuccessFn({
        args,
        data,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (
      this.$internals.onCompleteFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onCompleteFromProcedureFn({
        isSuccess: true,
        isError: false,
        status: "success",
        args,
        data,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$internals.onCompleteFn && !this.$internals.isProcedure) {
      await this.$internals.onCompleteFn({
        isSuccess: true,
        isError: false,
        status: "success",
        args,
        data,
      })
    }
  }

  /** helper function to handle errors with timeout checkpoints */
  public async handleError(err: any): Promise<[null, TError]> {
    // we need to throw any NEXT_REDIRECT errors so that next can
    // properly handle them.

    if (err.message === "NEXT_REDIRECT" || err.message === "NEXT_NOT_FOUND") {
      throw err
    }

    if (
      this.$internals.onErrorFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onErrorFromProcedureFn(err)
    }

    if (this.$internals.onErrorFn && !this.$internals.isProcedure) {
      await this.$internals.onErrorFn(err)
    }

    if (
      this.$internals.onCompleteFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onCompleteFromProcedureFn({
        isSuccess: false,
        isError: true,
        status: "error",
        error: err,
      })
    }

    if (this.$internals.onCompleteFn && !this.$internals.isProcedure) {
      await this.$internals.onCompleteFn({
        isSuccess: false,
        isError: true,
        status: "error",
        error: err,
      })
    }

    // the error will get returned to the action level
    if (this.$internals.isProcedure) {
      return [null, err]
    }

    const customError =
      err instanceof ZSAError ? err : new ZSAError("ERROR", err)

    const stringifyIfNeeded = (data: any) =>
      typeof data === "string" ? data : JSON.stringify(data)

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

    return [
      null,
      {
        data: stringifyIfNeeded(customError.data),
        name: customError.name,
        stack: JSON.stringify(customError.stack),
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
  ): Promise<TInputSchema["_output"]> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    const inputSchema = $overrideInputSchema || this.$internals.inputSchema

    if (!inputSchema) return data

    if (inputSchema instanceof z.ZodUndefined) return undefined

    const safe = await inputSchema.safeParseAsync(data)

    if (!safe.success) {
      if (this.$internals.onInputParseError) {
        await this.$internals.onInputParseError(safe.error)
      }
      throw new ZSAError("INPUT_PARSE_ERROR", safe.error)
    }

    return safe.data
  }

  public getTimeoutErrorPromise = (timeoutMs: number) =>
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ZSAError("TIMEOUT", `Exceeded timeout of ${timeoutMs} ms`))
      }, timeoutMs)
    })

  /** set the handler function for the server action */
  public handler<
    TRet extends TOutputSchema extends z.ZodUndefined
      ? any | Promise<any>
      : TOutputSchema["_output"] | Promise<TOutputSchema["_output"]>,
  >(
    fn: (v: {
      /** the parsed input to the action */
      input: TInputSchema["_output"]
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
      : TInputSchema extends z.ZodUndefined
        ? TNoInputHandlerFunc<
            TRet,
            TInputSchema,
            TOutputSchema,
            TError,
            TProcedureChainOutput
          >
        : THandlerFunc<
            TInputSchema,
            TOutputSchema,
            TError,
            TRet,
            TProcedureChainOutput,
            TInputType
          >
    : CompleteProcedure<
        TInputSchema,
        THandlerFunc<
          TInputSchema,
          TOutputSchema,
          TError,
          TRet,
          TProcedureChainOutput,
          "json"
        >
      > {
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    type TArgs = TInputType extends "json" ? TInputSchema["_input"] : FormData

    const wrapper = async (
      $args: TArgs,
      overrideArgs?: Partial<TInputSchema["_input"]>,
      opts?: THandlerOpts<TProcedureChainOutput>
    ): Promise<any> => {
      if (opts?.returnInputSchema) {
        return this.$internals.inputSchema
      } else if (opts?.returnOutputSchema) {
        return this.$internals.outputSchema
      }

      let args

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
            ...formDataToJson(args, this.$internals.inputSchema),
            ...(this.$internals.inputType !== "state"
              ? overrideArgs || {}
              : {}),
          }
        }

        await this.handleStart(args, timeoutStatus)

        if (!this.$internals.inputSchema && !this.$internals.isChained)
          throw new Error("No input schema")

        // run the procedure chain to get the context
        const ctx =
          this.$internals.isProcedure && opts
            ? (opts.ctx as TProcedureChainOutput)
            : await this.getProcedureChainOutput(
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
          })
        }

        return await this.handleError(err)
      }
    }

    // helper function to run a Promise race between the timeout and the wrapper
    const withTimeout = async (
      args: TArgs,
      overrideArgs?: Partial<TInputSchema["_input"]>,
      opts?: THandlerOpts<TProcedureChainOutput>
    ) => {
      const timeoutMs = this.$internals.timeout
      if (!timeoutMs) return await wrapper(args, overrideArgs, opts)

      return await Promise.race([
        wrapper(args, overrideArgs, opts),
        this.getTimeoutErrorPromise(timeoutMs),
      ])
        .then((r) => r)
        .catch((err) => {
          timeoutStatus.isTimeout = true
          return this.handleError(err)
        })
    }

    // if this is a procedure, we need to return the complete procedure
    if (this.$internals.isProcedure) {
      const handler: THandlerFunc<
        TInputSchema,
        TOutputSchema,
        TError,
        TRet,
        TProcedureChainOutput,
        "json"
      > = this.$internals.timeout ? withTimeout : wrapper

      return new CompleteProcedure({
        inputSchema: this.$internals.inputSchema,
        handlerChain: [...this.$internals.procedureHandlerChain, handler],
        lastHandler: handler,
        onCompleteFn:
          this.$internals.onCompleteFn ||
          this.$internals.onCompleteFromProcedureFn,
        onErrorFn:
          this.$internals.onErrorFn || this.$internals.onErrorFromProcedureFn,
        onStartFn:
          this.$internals.onStartFn || this.$internals.onStartFromProcedureFn,
        onSuccessFn:
          this.$internals.onSuccessFn ||
          this.$internals.onSuccessFromProcedureFn,
        timeout: this.$internals.timeout,
        retryConfig: this.$internals.retryConfig,
        shapeErrorFn: this.$internals.shapeErrorFn,
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
  z.ZodUndefined,
  z.ZodUndefined,
  TZSAError<z.ZodUndefined>,
  TZodSafeFunctionDefaultOmitted,
  undefined,
  TIsProcedure,
  "json"
> {
  return new ZodSafeFunction({
    inputSchema: parentProcedure?.$internals.inputSchema || z.undefined(),
    outputSchema: z.undefined(),
    isChained: parentProcedure !== undefined,
    isProcedure: isProcedure === true,
    procedureHandlerChain: parentProcedure?.$internals.handlerChain || [],
    onCompleteFromProcedureFn: parentProcedure?.$internals.onCompleteFn,
    onErrorFromProcedureFn: parentProcedure?.$internals.onErrorFn,
    onStartFromProcedureFn: parentProcedure?.$internals.onStartFn,
    onSuccessFromProcedureFn: parentProcedure?.$internals.onSuccessFn,
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
  z.ZodUndefined,
  z.ZodUndefined,
  TZSAError<z.ZodUndefined>,
  TZodSafeFunctionDefaultOmitted,
  undefined,
  false,
  "json"
> {
  return new ZodSafeFunction({
    inputSchema: z.undefined(),
    outputSchema: z.undefined(),
    procedureHandlerChain: [],
  }) as any
}
