import { z } from "zod"
import {
  TOnCompleteFn,
  TOnErrorFn,
  TOnStartFn,
  TOnSuccessFn,
} from "./callbacks"
import { SAWError, TSAWError } from "./errors"
import { CompleteProcedure, TAnyCompleteProcedure } from "./procedure"

/** The return type of a server action */
export type TDataOrError<TData> =
  | Promise<[Awaited<TData>, null]>
  | Promise<[null, TSAWError]>

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
  delay?: number | ((currentAttempt: number, err: SAWError) => number)
}

/** A function type for a handler that does not have an input */
export interface TNoInputHandlerFunc<
  TRet extends any,
  TOutputSchema extends z.ZodType,
  TProcedureChainOutput extends any,
> {
  (
    placeholder?: undefined,
    // very janky but basically in the `getProcedureChainOutput` function
    // we pass the context second
    $ctx?: TProcedureChainOutput,
    $overrideInputSchema?: undefined
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
> {
  (
    /** The input to the handler */
    args: TInputSchema["_input"],
    /** The context of the handler */
    $ctx?: TProcedureChainOutput,
    /** An optional override input schema */
    $overrideInputSchema?: z.ZodType
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
export type TAnyZodSafeFunctionHandler =
  | ((
      input: any,
      ctx?: any,
      $overrideInputSchema?: undefined
    ) => TDataOrError<any>)
  | ((
      placeholder?: undefined,
      ctx?: any,
      $overrideInputSchema?: z.ZodType
    ) => TDataOrError<any>)

/** A helper type to hold any zod safe function */
export interface TAnyZodSafeFunction
  extends ZodSafeFunction<any, any, any, any, boolean> {}

/** A helper type to wrap ZodSafeFunction in an Omit */
export type TZodSafeFunction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
> = Omit<
  ZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted,
    TProcedureChainOutput,
    TIsProcedure
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

  /** The number of atttempts the handler has made */
  attempts?: number | undefined

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

export class ZodSafeFunction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
> {
  /** The internals of the Zod Safe Function */
  public $internals: TInternals<TInputSchema, TOutputSchema, TIsProcedure>

  constructor(
    internals: TInternals<TInputSchema, TOutputSchema, TIsProcedure>
  ) {
    this.$internals = internals
  }

  /** Check if the timeout has triggered, if so, throw a SAWError */
  public checkTimeoutStatus(timeoutStatus: TimeoutStatus) {
    if (timeoutStatus.isTimeout) {
      throw new SAWError(
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
  public getRetryDelay($err: unknown) {
    try {
      const err = $err instanceof SAWError ? $err : new SAWError("ERROR", $err)

      const config = this.$internals.retryConfig
      if (!config) return -1

      this.$internals.attempts = this.$internals.attempts
        ? this.$internals.attempts + 1
        : 1

      const attempts = this.$internals.attempts || 0

      const shouldRetry = attempts < config.maxAttempts

      let retryDelay = 0
      if (typeof config.delay === "function") {
        retryDelay = config.delay(attempts + 1, err)
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
    timeoutStatus: TimeoutStatus
  ): Promise<TProcedureChainOutput> {
    let accData = undefined

    for (let i = 0; i < this.$internals.procedureHandlerChain.length; i += 1) {
      this.checkTimeoutStatus(timeoutStatus)

      const procedureHandler = this.$internals.procedureHandlerChain[i]!
      const [data, err] = await procedureHandler(args, accData)
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
    TIsProcedure
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
    TIsProcedure
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
  public input<T extends z.ZodType>(
    schema: T
  ): TZodSafeFunction<
    TInputSchema extends z.ZodUndefined
      ? T
      : z.ZodIntersection<TInputSchema, T>,
    TOutputSchema,
    "input" | Exclude<TOmitted, "onInputParseError">, // bring back the onInputParseError
    TProcedureChainOutput,
    TIsProcedure
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
    TIsProcedure
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
    TIsProcedure
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
    TIsProcedure
  > {
    return new ZodSafeFunction({
      ...this.$internals,
      onOutputParseError: fn,
    }) as any
  }

  /** set a handler function for errors */
  public onError(
    fn: (err: SAWError) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    "onError" | TOmitted,
    TProcedureChainOutput,
    TIsProcedure
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
    TIsProcedure
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
    TIsProcedure
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
    TIsProcedure
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
      throw new SAWError("OUTPUT_PARSE_ERROR", safe.error)
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
  public async handleError(err: any): Promise<[null, TSAWError]> {
    const customError =
      err instanceof SAWError ? err : new SAWError("ERROR", err)

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

    return [
      null,
      {
        data: JSON.stringify(customError.data),
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
      throw new SAWError("INPUT_PARSE_ERROR", safe.error)
    }

    return safe.data
  }

  public getTimeoutErrorPromise = (timeoutMs: number) =>
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new SAWError("TIMEOUT", `Exceeded timeout of ${timeoutMs} ms`))
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
    }) => TRet
  ): TIsProcedure extends false
    ? TInputSchema extends z.ZodUndefined
      ? TNoInputHandlerFunc<TRet, TOutputSchema, TProcedureChainOutput>
      : THandlerFunc<TInputSchema, TOutputSchema, TRet, TProcedureChainOutput>
    : CompleteProcedure<
        TInputSchema,
        THandlerFunc<TInputSchema, TOutputSchema, TRet, TProcedureChainOutput>
      > {
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    const wrapper = async (
      args: TInputSchema["_input"],
      $ctx?: TProcedureChainOutput,
      $overrideInputSchema?: z.ZodType
    ): Promise<any> => {
      try {
        await this.handleStart(args, timeoutStatus)

        if (!this.$internals.inputSchema && !this.$internals.isChained)
          throw new Error("No input schema")

        // run the procedure chain to get the context
        const ctx =
          $ctx || (await this.getProcedureChainOutput(args, timeoutStatus))

        // parse the input data
        const input = await this.parseInputData(
          args,
          timeoutStatus,
          $overrideInputSchema
        )

        // timeout checkpoint
        this.checkTimeoutStatus(timeoutStatus) // checkpoint

        const data = await fn({
          input,
          ctx,
        })

        const parsed = await this.parseOutputData(data, timeoutStatus)

        await this.handleSuccess(input, parsed, timeoutStatus)

        return [parsed, null]
      } catch (err) {
        const retryDelay = this.getRetryDelay(err)

        if (retryDelay >= 0) {
          await new Promise((r) => setTimeout(r, retryDelay))
          return await wrapper(args, $ctx, $overrideInputSchema)
        }

        return await this.handleError(err)
      }
    }

    // helper function to run a Promise race between the timeout and the wrapper
    const withTimeout = async (
      args: TInputSchema["_input"],
      ctx?: TProcedureChainOutput,
      $overrideInputSchema?: z.ZodType
    ) => {
      const timeoutMs = this.$internals.timeout
      if (!timeoutMs) return await wrapper(args, ctx, $overrideInputSchema)

      return await Promise.race([
        wrapper(args, ctx, $overrideInputSchema),
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
        TProcedureChainOutput
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
  TIsProcedure
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
  false
> {
  return new ZodSafeFunction({
    inputSchema: z.undefined(),
    outputSchema: z.undefined(),
    procedureHandlerChain: [],
  }) as any
}
