import { z } from "zod"
import { SAWError, TSAWError } from "./errors"

export type TDataOrError<TData> =
  | Promise<[Awaited<TData>, null]>
  | Promise<[null, TSAWError]>

export interface TCompleteProcedureInternals<
  TInputSchema extends z.ZodType,
  THandler extends TAnyZodSafeFunctionHandler,
> {
  inputSchema: TInputSchema
  handlerChain: TAnyZodSafeFunctionHandler[]
  lastHandler: THandler
  onErrorFn: TOnErrorFn | undefined
  onStartFn: TOnStartFn<any, true> | undefined
  onSuccessFn: TOnSuccessFn<any, any, true> | undefined
  onCompleteFn: TOnCompleteFn<any, any, true> | undefined
  timeout: number | undefined
}

export class CompleteProcedure<
  TInputSchema extends z.ZodType,
  THandler extends TAnyZodSafeFunctionHandler,
> {
  $internals: TCompleteProcedureInternals<TInputSchema, THandler>

  constructor(params: TCompleteProcedureInternals<TInputSchema, THandler>) {
    this.$internals = params
  }

  createServerAction(): TZodSafeFunction<
    TInputSchema,
    z.ZodUndefined,
    TInputSchema extends z.ZodUndefined
      ? TZodSafeFunctionDefaultOmitted
      :
          | Exclude<
              TZodSafeFunctionDefaultOmitted,
              "input" | "onInputParseError" | "handler"
            >
          | "noInputHandler",
    inferServerActionReturnData<THandler>,
    false
  > {
    return new ZodSafeFunction({
      inputSchema: this.$internals.inputSchema,
      outputSchema: z.undefined(),
      procedureHandlerChain: this.$internals.handlerChain,
      onErrorFromProcedureFn: this.$internals.onErrorFn,
      onStartFromProcedureFn: this.$internals.onStartFn,
      onSuccessFromProcedureFn: this.$internals.onSuccessFn,
      onCompleteFromProcedureFn: this.$internals.onCompleteFn,
      timeout: this.$internals.timeout,
    }) as any
  }
}

export interface TAnyCompleteProcedure extends CompleteProcedure<any, any> {}

export interface TNoHandlerFunc<
  TRet extends any,
  TOutputSchema extends z.ZodType,
  TProcedureChainOutput extends any,
> {
  (
    placeholder?: undefined,
    // very janky but basically in the `getProcedureChainOutput` function
    // we pass the context second
    $ctx?: TProcedureChainOutput
  ): TDataOrError<
    TOutputSchema extends z.ZodUndefined ? TRet : TOutputSchema["_output"]
  >
}

export interface THandlerFunc<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TRet extends any,
  TProcedureChainOutput extends any,
> {
  (
    args: TInputSchema["_input"],
    $ctx?: TProcedureChainOutput
  ): TDataOrError<
    TOutputSchema extends z.ZodUndefined ? TRet : TOutputSchema["_output"]
  >
}

interface TimeoutStatus {
  isTimeout: boolean
}

const DefaultOmitted = {
  handler: 1,
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
} as const

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted

export type TAnyZodSafeFunctionHandler =
  | ((input: any, ctx?: any) => TDataOrError<any>)
  | ((placeholder?: undefined, ctx?: any) => TDataOrError<any>)

export interface TAnyZodSafeFunction
  extends ZodSafeFunction<any, any, any, any, boolean> {}

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

export interface TOnErrorFn {
  (err: SAWError): any
}

export interface TOnStartFn<
  TInputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  (value: {
    args: TIsProcedure extends false ? TInputSchema["_input"] : unknown
  }): any
}

export interface TOnSuccessFn<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  (value: {
    args: TIsProcedure extends false ? TInputSchema["_output"] : unknown
    data: TIsProcedure extends false ? TOutputSchema["_output"] : unknown
  }): any
}

export interface TOnCompleteFn<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  (
    value:
      | {
          isSuccess: true
          isError: false
          status: "success"
          args: TIsProcedure extends false ? TInputSchema["_output"] : unknown
          data: TIsProcedure extends false ? TOutputSchema["_output"] : unknown
        }
      | {
          isSuccess: false
          isError: true
          status: "error"
          error: SAWError
        }
  ): any
}

interface TInternals<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  procedureHandlerChain: TAnyZodSafeFunctionHandler[]

  inputSchema: TInputSchema
  outputSchema: TOutputSchema

  onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined
  onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined

  timeout?: number | undefined

  onErrorFn?: TOnErrorFn | undefined
  onStartFn?: TOnStartFn<TInputSchema, TIsProcedure> | undefined
  onSuccessFn?:
    | TOnSuccessFn<TInputSchema, TOutputSchema, TIsProcedure>
    | undefined
  onCompleteFn?:
    | TOnCompleteFn<TInputSchema, TOutputSchema, TIsProcedure>
    | undefined

  onErrorFromProcedureFn?: TOnErrorFn | undefined
  onStartFromProcedureFn?: TOnStartFn<TInputSchema, true> | undefined
  onSuccessFromProcedureFn?:
    | TOnSuccessFn<TInputSchema, TOutputSchema, true>
    | undefined
  onCompleteFromProcedureFn?:
    | TOnCompleteFn<TInputSchema, TOutputSchema, true>
    | undefined

  isChained?: boolean | undefined
  isProcedure?: TIsProcedure | undefined

  handler?: TAnyZodSafeFunctionHandler | undefined
}

export class ZodSafeFunction<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
> {
  public $internals: TInternals<TInputSchema, TOutputSchema, TIsProcedure>

  constructor(
    internals: TInternals<TInputSchema, TOutputSchema, TIsProcedure>
  ) {
    this.$internals = internals
  }

  public checkTimeoutStatus(timeoutStatus: TimeoutStatus) {
    if (timeoutStatus.isTimeout) {
      throw new SAWError(
        "TIMEOUT",
        `Exceeded timeout of ${this.$internals.timeout} ms`
      )
    }
  }

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
      accData = data as any
    }

    return accData as any
  }

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

  public input<T extends z.ZodType>(
    schema: T
  ): TZodSafeFunction<
    TInputSchema extends z.ZodUndefined
      ? T
      : z.ZodIntersection<TInputSchema, T>,
    TOutputSchema,
    | "input"
    | "noInputHandler"
    | Exclude<TOmitted, "handler" | "onInputParseError">, // bring back the handler and onInputParseError
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

  public async parseInputData(
    data: any,
    timeoutStatus: TimeoutStatus
  ): Promise<TInputSchema["_output"]> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint
    if (!this.$internals.inputSchema) return data

    if (this.$internals.inputSchema instanceof z.ZodUndefined) return undefined

    const safe = await this.$internals.inputSchema.safeParseAsync(data)

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

  public noInputHandler<
    TRet extends TOutputSchema extends z.ZodUndefined
      ? any | Promise<any>
      : TOutputSchema["_output"] | Promise<TOutputSchema["_output"]>,
  >(
    fn: (v: { ctx: TProcedureChainOutput }) => TRet
  ): TIsProcedure extends false
    ? TNoHandlerFunc<TRet, TOutputSchema, TProcedureChainOutput>
    : CompleteProcedure<
        TInputSchema,
        TNoHandlerFunc<TRet, TOutputSchema, TProcedureChainOutput>
      > {
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    const wrapper = async ($placeholder: any, $ctx?: TProcedureChainOutput) => {
      try {
        await this.handleStart(undefined, timeoutStatus)

        const ctx =
          $ctx ||
          (await this.getProcedureChainOutput($placeholder, timeoutStatus))

        this.checkTimeoutStatus(timeoutStatus) // checkpoint

        const data = await fn({ ctx })

        const parsed = await this.parseOutputData(data, timeoutStatus)

        await this.handleSuccess(undefined, parsed, timeoutStatus)

        return [parsed, null]
      } catch (err) {
        return await this.handleError(err)
      }
    }

    const withTimeout = async (
      $placeholder: any,
      $ctx?: TProcedureChainOutput
    ) => {
      const timeoutMs = this.$internals.timeout
      if (!timeoutMs) return await wrapper($placeholder, $ctx)
      return await Promise.race([
        wrapper($placeholder, $ctx),
        this.getTimeoutErrorPromise(timeoutMs),
      ])
        .then((r) => r)
        .catch(async (err) => {
          timeoutStatus.isTimeout = true
          return await this.handleError(err)
        })
    }

    if (this.$internals.isProcedure) {
      // @ts-expect-error
      const noHandlerFn: TNoHandlerFunc<
        TRet,
        TOutputSchema,
        TProcedureChainOutput
      > = this.$internals.timeout ? withTimeout : wrapper

      return new CompleteProcedure({
        inputSchema: this.$internals.inputSchema,
        handlerChain: [...this.$internals.procedureHandlerChain, noHandlerFn],
        lastHandler: noHandlerFn,
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
      }) as any
    }

    if (this.$internals.timeout) {
      return withTimeout as any
    }

    return wrapper as any
  }

  public handler<
    TRet extends TOutputSchema extends z.ZodUndefined
      ? any | Promise<any>
      : TOutputSchema["_output"] | Promise<TOutputSchema["_output"]>,
  >(
    fn: (v: {
      input: TInputSchema["_output"]
      ctx: TProcedureChainOutput
    }) => TRet
  ): TIsProcedure extends false
    ? THandlerFunc<TInputSchema, TOutputSchema, TRet, TProcedureChainOutput>
    : CompleteProcedure<
        TInputSchema,
        THandlerFunc<TInputSchema, TOutputSchema, TRet, TProcedureChainOutput>
      > {
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    const wrapper = async (
      args: TInputSchema["_input"],
      $ctx?: TProcedureChainOutput
    ) => {
      try {
        await this.handleStart(args, timeoutStatus)

        if (!this.$internals.inputSchema && !this.$internals.isChained)
          throw new Error("No input schema")

        // run the procedure chain to get the context
        const ctx =
          $ctx || (await this.getProcedureChainOutput(args, timeoutStatus))

        // parse the input data
        const input = await this.parseInputData(args, timeoutStatus)

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
        return await this.handleError(err)
      }
    }

    const withTimeout = async (
      args: TInputSchema["_input"],
      ctx?: TProcedureChainOutput
    ) => {
      const timeoutMs = this.$internals.timeout
      if (!timeoutMs) return await wrapper(args, ctx)

      return await Promise.race([
        wrapper(args, ctx),
        this.getTimeoutErrorPromise(timeoutMs),
      ])
        .then((r) => r)
        .catch((err) => {
          timeoutStatus.isTimeout = true
          return this.handleError(err)
        })
    }

    if (this.$internals.isProcedure) {
      // @ts-expect-error
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
      }) as any
    }

    if (this.$internals.timeout) {
      return withTimeout as any
    }

    return wrapper as any
  }
}

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

export type inferServerActionReturnData<
  TAction extends TAnyZodSafeFunctionHandler,
> = NonNullable<Awaited<ReturnType<TAction>>[0]>

export type inferServerActionReturnType<
  TAction extends TAnyZodSafeFunctionHandler,
> = Awaited<ReturnType<TAction>>

export type inferServerActionInput<TAction extends TAnyZodSafeFunctionHandler> =
  Parameters<TAction>[0]

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
