import { z } from "zod"
import {
  TOnCompleteFn,
  TOnErrorFn,
  TOnStartFn,
  TOnSuccessFn,
} from "./callbacks"
import { TZSAError, ZSAError } from "./errors"
import { NextRequest } from "./next-request"
import { CompleteProcedure, TAnyCompleteProcedure } from "./procedure"

/** Replace void with undefined */
type TReplaceVoidWithUndefined<T extends Promise<any>> =
  Extract<Awaited<T>, void> extends never
    ? T
    : Promise<Exclude<Awaited<T>, void> | undefined>

/** The return type of a server action */
export type TDataOrError<TData extends Promise<any>> =
  | Promise<[Awaited<TReplaceVoidWithUndefined<TData>>, null]>
  | Promise<[null, TZSAError]>

/** A configuration object for retrying a server action */
export interface RetryConfig {
  /** The maximum number of times to retry the action. Inclusive. */
  maxAttempts: number
  /**
   * The delay in milliseconds between each retry attempt.
   *
   * Can either be a number (ms) or a function that takes the
   * current attempt number and the error as arguments and returns a number of ms.
   *
   * NOTE: The current attempt starts at 2
   * (the first attempt errored then the current attempt becomes is 2)
   *
   * @example
   * Exponential backoff
   * ```ts
   * delay: (currentAttempt) =>
   *   Math.min(
   *     currentAttempt > 2 ? 2 ** currentAttempt * 1000 : 1000,
   *     30 * 1000
   *   ),
   * ```
   *
   * @example
   * Linear backoff
   * ```ts
   * delay: (currentAttempt) =>
   *   (currentAttempt - 1) * 1000,
   * ```
   */
  delay?: number | ((currentAttempt: number, err: ZSAError) => number)
}

export interface THandlerOpts<TProcedureChainOutput extends any> {
  /** The context of the handler */
  ctx?: TProcedureChainOutput
  /** Override the input schema */
  overrideInputSchema?: z.ZodType
  /** return the input schema */
  returnInputSchema?: boolean
  /** return the output schema */
  returnOutputSchema?: boolean
  /** an associated request object */
  request?: NextRequest
  /** the number of attempts the handler has made */
  attempts?: number
}

/** A function type for a handler that does not have an input */
export interface TNoInputHandlerFunc<
  TRet extends any,
  TOutputSchema extends z.ZodType,
  TProcedureChainOutput extends any,
> {
  (
    placeholder?: undefined,
    $overrideArgs?: undefined,
    $opts?: THandlerOpts<TProcedureChainOutput>
  ): TDataOrError<
    TOutputSchema extends z.ZodUndefined ? TRet : TOutputSchema["_output"]
  >
}

/** A function type for a handler that has an input */
export interface THandlerFunc<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TRet extends any,
  TProcedureChainOutput extends any,
  TInputType extends InputTypeOptions,
> {
  (
    /** The input to the handler */
    args: TInputType extends "json" ? TInputSchema["_input"] : FormData,
    /** Override the args */
    $overrideArgs?: Partial<TInputSchema["_input"]>,
    /** Options for the handler */
    $opts?: THandlerOpts<TProcedureChainOutput>
  ): TDataOrError<
    TOutputSchema extends z.ZodUndefined ? TRet : TOutputSchema["_output"]
  >
}

/** a helper type to hold the status of a timeout */
interface TimeoutStatus {
  isTimeout: boolean
}

/** which keys should be default omitted from the safe zod function */
const DefaultOmitted = {
  $internals: 1,
  handleError: 1,
  onInputParseError: 1,
  getTimeoutErrorPromise: 1,
  getProcedureChainOutput: 1,
  handleSuccess: 1,
  handleStart: 1,
  parseInputData: 1,
  parseOutputData: 1,
  onOutputParseError: 1,
  checkTimeoutStatus: 1,
  getRetryDelay: 1,
} as const

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted

/** A combination of both a no input handler and a handler */
export type TAnyZodSafeFunctionHandler<
  TData extends Promise<any> = Promise<any>,
> =
  | ((
      input: any,
      overrideArgs?: any,
      opts?: THandlerOpts<any>
    ) => TDataOrError<TData>)
  | ((
      placeholder?: undefined,
      overrideArgs?: undefined,
      opts?: THandlerOpts<any>
    ) => TDataOrError<TData>)

/** A helper type to hold any zod safe function */
export interface TAnyZodSafeFunction
  extends ZodSafeFunction<any, any, any, any, boolean, any> {}

/** A helper type to wrap ZodSafeFunction in an Omit */
export type TZodSafeFunction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
  TInputType extends InputTypeOptions,
> = Omit<
  ZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted,
    TProcedureChainOutput,
    TIsProcedure,
    TInputType
  >,
  TOmitted
>

/**
 * A data type for the internals of a Zod Safe Function
 */
interface TInternals<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  /**
   *
   * A chain of handler functions to run before the main handler (if any)
   *
   * These would come from the procedure chain
   *
   */
  procedureHandlerChain: TAnyZodSafeFunctionHandler[]

  /** The final input schema of the handler */
  inputSchema: TInputSchema

  /** The final output schema of the handler */
  outputSchema: TOutputSchema

  /** A function to run when an input parse error occurs */
  onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined

  /** A function to run when the output parse error occurs */
  onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined

  /**
   * The timeout of the handler in milliseconds
   */
  timeout?: number | undefined

  /**
   * The retry configuration of the handler
   */
  retryConfig?: RetryConfig | undefined

  /** A function to run when the handler errors */
  onErrorFn?: TOnErrorFn | undefined

  /** A function to run when the handler starts */
  onStartFn?: TOnStartFn<TInputSchema, TIsProcedure> | undefined

  /** A function to run when the handler succeeds */
  onSuccessFn?:
    | TOnSuccessFn<TInputSchema, TOutputSchema, TIsProcedure>
    | undefined

  /** A function to run when the handler completes (success or error) */
  onCompleteFn?:
    | TOnCompleteFn<TInputSchema, TOutputSchema, TIsProcedure>
    | undefined

  /** The procedure function to run when an error occurs */
  onErrorFromProcedureFn?: TOnErrorFn | undefined

  /** The procedure function to run when the handler starts */
  onStartFromProcedureFn?: TOnStartFn<TInputSchema, true> | undefined

  /** The procedure function to run when the handler succeeds */
  onSuccessFromProcedureFn?:
    | TOnSuccessFn<TInputSchema, TOutputSchema, true>
    | undefined

  /** The procedure function to run when the handler completes (success or error) */
  onCompleteFromProcedureFn?:
    | TOnCompleteFn<TInputSchema, TOutputSchema, true>
    | undefined

  /** Boolean indicating if the procedure has a parent */
  isChained?: boolean | undefined

  /** Boolean indicating if the handler is a procedure */
  isProcedure?: TIsProcedure | undefined

  /** The handler function */
  handler?: TAnyZodSafeFunctionHandler | undefined
}

type InputTypeOptions = "formData" | "json"

export class ZodSafeFunction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
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
    request: NextRequest | undefined
  ): Promise<TProcedureChainOutput> {
    let accData = undefined

    for (let i = 0; i < this.$internals.procedureHandlerChain.length; i += 1) {
      this.checkTimeoutStatus(timeoutStatus)

      const procedureHandler = this.$internals.procedureHandlerChain[i]!
      const [data, err] = await procedureHandler(args, undefined, {
        ctx: accData,
        request,
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
    TInputSchema extends z.ZodUndefined
      ? T
      : z.ZodIntersection<TInputSchema, T>,
    TOutputSchema,
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
    }) as any
  }

  /** set the output schema for the server action */
  public output<T extends z.ZodType>(
    schema: T
  ): TZodSafeFunction<
    TInputSchema,
    T,
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
    fn: (err: ZSAError) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
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
  public onStart(
    fn: TOnStartFn<TInputSchema, TIsProcedure>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
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
  public async handleError(err: any): Promise<[null, TZSAError]> {
    const customError =
      err instanceof ZSAError ? err : new ZSAError("ERROR", err)

    if (
      this.$internals.onErrorFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onErrorFromProcedureFn(customError)
    }

    if (this.$internals.onErrorFn && !this.$internals.isProcedure) {
      await this.$internals.onErrorFn(customError)
    }

    if (
      this.$internals.onCompleteFromProcedureFn &&
      !this.$internals.isProcedure
    ) {
      await this.$internals.onCompleteFromProcedureFn({
        isSuccess: false,
        isError: true,
        status: "error",
        error: customError,
      })
    }

    if (this.$internals.onCompleteFn && !this.$internals.isProcedure) {
      await this.$internals.onCompleteFn({
        isSuccess: false,
        isError: true,
        status: "error",
        error: customError,
      })
    }

    // the error will get returned to the action level
    if (this.$internals.isProcedure) {
      return [null, customError as any]
    }

    return [
      null,
      {
        data:
          typeof customError.data === "string"
            ? customError.data
            : JSON.stringify(customError.data),
        name: customError.name,
        stack: JSON.stringify(customError.stack),
        message: JSON.stringify(customError.message),
        code: customError.code,
      },
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
    }) => TRet
  ): TIsProcedure extends false
    ? TInputSchema extends z.ZodUndefined
      ? TNoInputHandlerFunc<TRet, TOutputSchema, TProcedureChainOutput>
      : THandlerFunc<
          TInputSchema,
          TOutputSchema,
          TRet,
          TProcedureChainOutput,
          TInputType
        >
    : CompleteProcedure<
        TInputSchema,
        THandlerFunc<
          TInputSchema,
          TOutputSchema,
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
      args: TArgs,
      overrideArgs?: Partial<TInputSchema["_input"]>,
      opts?: THandlerOpts<TProcedureChainOutput>
    ): Promise<any> => {
      if (opts?.returnInputSchema) {
        return this.$internals.inputSchema
      } else if (opts?.returnOutputSchema) {
        return this.$internals.outputSchema
      }

      try {
        // if args is formData
        if (args instanceof FormData) {
          args = {
            ...(Object.fromEntries(args.entries()) as any),
            ...(overrideArgs || {}),
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
                opts?.request
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
        })

        const parsed = await this.parseOutputData(data, timeoutStatus)

        await this.handleSuccess(input, parsed, timeoutStatus)

        return [parsed, null]
      } catch (err) {
        const retryDelay = this.getRetryDelay(err, opts?.attempts || 1)

        if (retryDelay >= 0) {
          await new Promise((r) => setTimeout(r, retryDelay))
          return await wrapper(args, overrideArgs, {
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
> = NonNullable<Awaited<ReturnType<TAction>>[0]>

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
