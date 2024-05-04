import { z } from "zod"
import { SAWError, TSAWError } from "./errors"

export type TDataOrError<TData> =
  | Promise<[Awaited<TData>, null]>
  | Promise<[null, TSAWError]>

type TNoHandlerFunc<TRet extends any> = () => TDataOrError<TRet>

type THandlerFunc<TInput extends TAnyObject | undefined, TRet extends any> = (
  args: TInput
) => TDataOrError<TRet>

interface TimeoutStatus {
  isTimeout: boolean
}

const DefaultOmitted = {
  $inputSchema: 1,
  $outputSchema: 1,
  handler: 1,
  handleError: 1,
  getErrorObject: 1,
  $onInputParseError: 1,
  $onOutputParseError: 1,
  $onError: 1,
  onInputParseError: 1,
  $onErrorFromWrapper: 1,
  $onStartFromWrapper: 1,
  $onSuccessFromWrapper: 1,
  getTimeoutErrorPromise: 1,
  $onCompleteFromWrapper: 1,
  procedureChain: 1,
  getParams: 1,
  getProcedureChainOutput: 1,
  handleSuccess: 1,
  handleStart: 1,
  parseInputData: 1,
  parseOutputData: 1,
  onOutputParseError: 1,
  $procedureChain: 1,
  $isChained: 1,
  $firstProcedureInput: 1,
  $id: 1,
  $onStartFn: 1,
  $timeout: 1,
  checkTimeoutStatus: 1,
  $onSuccessFn: 1,
  $onCompleteFn: 1,
} as const

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted

export type TAnyZodSafeFunctionHandler =
  | ((input: any) => TDataOrError<any>)
  | (() => TDataOrError<any>)

export type TAnyZodSafeFunction = ZodSafeFunction<any, any, any, any, any>

export type TZodObject =
  | z.ZodDefault<z.AnyZodObject>
  | z.ZodObject<any>
  | z.ZodOptional<z.AnyZodObject>
  | z.ZodEffects<z.AnyZodObject>

type TAnyObject = {
  [key: string]: any
}

interface TZodSafeFunctionInner<
  TInput extends TAnyObject | undefined,
  TParsedInput extends TAnyObject | undefined,
  TOutput extends TAnyObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
> extends ZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    TOmitted,
    TProcedureChainOutput
  > {}

export type TZodSafeFunction<
  TInput extends TAnyObject | undefined,
  TParsedInput extends TAnyObject | undefined,
  TOutput extends TAnyObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
> = Omit<
  TZodSafeFunctionInner<
    TInput,
    TParsedInput,
    TOutput,
    TOmitted,
    TProcedureChainOutput
  >,
  TOmitted
>

interface TOnStartFn<TInput extends TAnyObject | undefined> {
  (value: { args: TInput }): any
}

interface TOnSuccessFn<
  TParsedInput extends TAnyObject | undefined,
  TOutput extends TAnyObject | undefined,
> {
  (value: { args: TParsedInput; data: TOutput }): any
}

interface TOnCompleteFn<
  TParsedInput extends TAnyObject | undefined,
  TOutput extends TAnyObject | undefined,
> {
  (
    value:
      | {
          isSuccess: true
          isError: false
          status: "success"
          args: TParsedInput
          data: TOutput
        }
      | {
          isSuccess: false
          isError: true
          status: "error"
          error: SAWError
        }
  ): any
}

type TId = string | undefined

export interface TOnStartFnFromWrapper {
  (value: { args: unknown; id: TId }): any
}

export interface TOnSuccessFnFromWrapper {
  (value: { args: unknown; data: unknown; id: TId }): any
}

export interface TOnCompleteFnFromWrapper {
  (
    value:
      | {
          isSuccess: true
          isError: false
          status: "success"
          args: unknown
          data: unknown
          id: TId
        }
      | {
          isSuccess: false
          isError: true
          status: "error"
          error: SAWError
          id: TId
        }
  ): any
}

export interface TOnErrorFnFromWrapper {
  (value: { err: SAWError; id: TId }): any
}

export class ZodSafeFunction<
  TInput extends TAnyObject | undefined,
  TParsedInput extends TAnyObject | undefined,
  TOutput extends TAnyObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
> {
  public $procedureChain: TAnyZodSafeFunctionHandler[] = []
  public $inputSchema: TAnyObject | undefined
  public $outputSchema: TAnyObject | undefined
  public $onInputParseError: ((err: any) => any) | undefined
  public $onOutputParseError: ((err: any) => any) | undefined
  public $firstProcedureInput: any
  public $id: string | undefined
  public $timeout: number | undefined

  public $onError: ((err: SAWError) => any) | undefined
  public $onStartFn: TOnStartFn<TInput> | undefined
  public $onSuccessFn: TOnSuccessFn<TParsedInput, TOutput> | undefined
  public $onCompleteFn: TOnCompleteFn<TParsedInput, TOutput> | undefined

  public $onErrorFromWrapper: TOnErrorFnFromWrapper | undefined
  public $onStartFromWrapper: TOnStartFnFromWrapper | undefined
  public $onSuccessFromWrapper: TOnSuccessFnFromWrapper | undefined
  public $onCompleteFromWrapper: TOnCompleteFnFromWrapper | undefined

  public $isChained: boolean | undefined

  constructor(params: {
    inputSchema: TAnyObject | undefined
    outputSchema: TAnyObject | undefined
    onInputParseError?: ((err: z.ZodError<TInput>) => any) | undefined
    onOutputParseError?: ((err: z.ZodError<TOutput>) => any) | undefined
    procedureChain?: TAnyZodSafeFunctionHandler[]
    firstProcedureInput?: any
    id?: string | undefined

    timeout?: number | undefined

    isChained?: boolean | undefined

    onError?: ((err: SAWError) => any) | undefined
    onStart?: TOnStartFn<TInput> | undefined
    onSuccess?: TOnSuccessFn<TParsedInput, TOutput> | undefined
    onComplete?: TOnCompleteFn<TParsedInput, TOutput> | undefined

    onErrorFromWrapper?: TOnErrorFnFromWrapper | undefined
    onStartFromWrapper?: TOnStartFnFromWrapper | undefined
    onSuccessFromWrapper?: TOnSuccessFnFromWrapper | undefined
    onCompleteFromWrapper?: TOnCompleteFnFromWrapper | undefined
  }) {
    this.$inputSchema = params.inputSchema
    this.$outputSchema = params.outputSchema
    this.$onInputParseError = params.onInputParseError
    this.$onOutputParseError = params.onOutputParseError
    this.$procedureChain = params.procedureChain || []
    this.$firstProcedureInput = params.firstProcedureInput
    this.$id = params.id
    this.$timeout = params.timeout

    this.$isChained = params.isChained

    this.$onError = params.onError
    this.$onStartFn = params.onStart
    this.$onSuccessFn = params.onSuccess
    this.$onCompleteFn = params.onComplete

    this.$onErrorFromWrapper = params.onErrorFromWrapper
    this.$onStartFromWrapper = params.onStartFromWrapper
    this.$onSuccessFromWrapper = params.onSuccessFromWrapper
    this.$onCompleteFromWrapper = params.onCompleteFromWrapper
  }

  public getParams() {
    return {
      procedureChain: this.$procedureChain,
      inputSchema: this.$inputSchema,
      outputSchema: this.$outputSchema,
      onInputParseError: this.$onInputParseError,
      onOutputParseError: this.$onOutputParseError,
      onError: this.$onError,
      firstProcedureInput: this.$firstProcedureInput,
      timeout: this.$timeout,
      id: this.$id,
      onStart: this.$onStartFn,
      onSuccess: this.$onSuccessFn,
      onComplete: this.$onCompleteFn,

      onErrorFromWrapper: this.$onErrorFromWrapper,
      onStartFromWrapper: this.$onStartFromWrapper,
      onSuccessFromWrapper: this.$onSuccessFromWrapper,
      onCompleteFromWrapper: this.$onCompleteFromWrapper,
    } as const
  }

  public checkTimeoutStatus(timeoutStatus: TimeoutStatus) {
    if (timeoutStatus.isTimeout) {
      throw new SAWError("TIMEOUT", `Exceeded timeout of ${this.$timeout} ms`)
    }
  }

  public async getProcedureChainOutput(
    timeoutStatus: TimeoutStatus
  ): Promise<TProcedureChainOutput> {
    let accData = this.$firstProcedureInput
    for (let i = 0; i < this.$procedureChain.length; i += 1) {
      this.checkTimeoutStatus(timeoutStatus)

      const fn = this.$procedureChain[i]!
      const [data, err] = await fn(accData)
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
    TInput,
    TParsedInput,
    TOutput,
    TOmitted | "timeout",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      timeout: milliseconds,
    }) as any
  }

  public id<T extends string>(
    id: T
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    TOmitted | "id",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      id,
    }) as any
  }

  public input<T extends TZodObject>(
    schema: T
  ): TZodSafeFunction<
    z.input<T>,
    z.infer<T>,
    TOutput,
    | "input"
    | "noInputHandler"
    | Exclude<TOmitted, "handler" | "onInputParseError">, // bring back the handler and onInputParseError
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      inputSchema: schema,
      onStart: this.$onStartFn as any,
      onSuccess: this.$onSuccessFn as any,
      onComplete: this.$onCompleteFn as any,
    }) as any
  }

  public output<T extends TZodObject>(
    schema: T
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    z.output<T>,
    "output" | Exclude<TOmitted, "onOutputParseError">,
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      outputSchema: schema,
      onSuccess: this.$onSuccessFn as any,
      onComplete: this.$onCompleteFn as any,
    }) as any
  }

  public onInputParseError(
    fn: (err: z.ZodError<any>) => any
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    "onInputParseError" | TOmitted,
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onInputParseError: fn,
    }) as any
  }

  public onOutputParseError(
    fn: (err: z.ZodError<any>) => any
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    "onOutputParseError" | TOmitted,
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onOutputParseError: fn,
    }) as any
  }

  public onError(
    fn: (err: SAWError) => any
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    "onError" | TOmitted,
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onError: fn,
    }) as any
  }

  public onStart(
    fn: TOnStartFn<TInput>
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    TOmitted | "onStart",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onStart: fn,
    }) as any
  }

  public onSuccess(
    fn: TOnSuccessFn<TParsedInput, TOutput>
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    TOmitted | "onSuccess",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onSuccess: fn,
    }) as any
  }

  public onComplete(
    fn: TOnCompleteFn<TParsedInput, TOutput>
  ): TZodSafeFunction<
    TInput,
    TParsedInput,
    TOutput,
    TOmitted | "onComplete",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onComplete: fn,
    }) as any
  }

  public async parseOutputData(
    data: any,
    timeoutStatus: TimeoutStatus
  ): Promise<TOutput> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint
    if (!this.$outputSchema) return data
    const safe = await this.$outputSchema.safeParseAsync(data)
    if (!safe.success) {
      if (this.$onOutputParseError) {
        await this.$onOutputParseError(safe.error)
      }
      throw new SAWError("OUTPUT_PARSE_ERROR", safe.error)
    }
    return safe.data
  }

  public async handleStart(args: any, timeoutStatus: TimeoutStatus) {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$onStartFromWrapper) {
      await this.$onStartFromWrapper({
        args,
        id: this.$id,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (!this.$onStartFn) return
    await this.$onStartFn({
      args,
    })
  }

  public async handleSuccess(
    args: any,
    data: any,
    timeoutStatus: TimeoutStatus
  ) {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$onSuccessFromWrapper) {
      await this.$onSuccessFromWrapper({
        args,
        data,
        id: this.$id,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$onSuccessFn) {
      await this.$onSuccessFn({
        args,
        data,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$onCompleteFromWrapper) {
      await this.$onCompleteFromWrapper({
        isSuccess: true,
        isError: false,
        status: "success",
        args,
        data,
        id: this.$id,
      })
    }

    this.checkTimeoutStatus(timeoutStatus) // checkpoint

    if (this.$onCompleteFn) {
      await this.$onCompleteFn({
        isSuccess: true,
        isError: false,
        status: "success",
        args: this.$firstProcedureInput,
        data,
      })
    }
  }

  public async handleError(err: any): Promise<[null, TSAWError]> {
    const customError =
      err instanceof SAWError ? err : new SAWError("ERROR", err)

    if (this.$onError) {
      await this.$onError(customError)
    }

    if (this.$onErrorFromWrapper) {
      await this.$onErrorFromWrapper({ err: customError, id: this.$id })
    }

    if (this.$onCompleteFromWrapper) {
      await this.$onCompleteFromWrapper({
        isSuccess: false,
        isError: true,
        status: "error",
        error: customError,
        id: this.$id,
      })
    }

    if (this.$onCompleteFn) {
      await this.$onCompleteFn({
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
  ): Promise<TParsedInput> {
    this.checkTimeoutStatus(timeoutStatus) // checkpoint
    if (!this.$inputSchema) return data
    const safe = await this.$inputSchema.safeParseAsync(data)
    if (!safe.success) {
      if (this.$onInputParseError) {
        await this.$onInputParseError(safe.error)
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
    TRet extends TOutput extends undefined
      ? any | Promise<any>
      : TOutput | Promise<TOutput>,
  >(fn: (v: { ctx: TProcedureChainOutput }) => TRet): TNoHandlerFunc<TRet> {
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    const wrapper = async () => {
      try {
        await this.handleStart(undefined, timeoutStatus)

        const ctx = await this.getProcedureChainOutput(timeoutStatus)

        this.checkTimeoutStatus(timeoutStatus) // checkpoint

        const data = await fn({ ctx })

        const parsed = await this.parseOutputData(data, timeoutStatus)

        await this.handleSuccess(undefined, parsed, timeoutStatus)

        return [parsed, null]
      } catch (err) {
        return await this.handleError(err)
      }
    }

    const withTimeout = async () => {
      const timeoutMs = this.$timeout
      if (!timeoutMs) return await wrapper()
      return await Promise.race([
        wrapper(),
        this.getTimeoutErrorPromise(timeoutMs),
      ])
        .then((r) => r)
        .catch(async (err) => {
          timeoutStatus.isTimeout = true
          return await this.handleError(err)
        })
    }

    if (this.$timeout) {
      return withTimeout as any
    }

    return wrapper as any
  }

  public handler<
    TRet extends TOutput extends undefined
      ? any | Promise<any>
      : TOutput | Promise<TOutput>,
  >(
    fn: (v: { input: TParsedInput; ctx: TProcedureChainOutput }) => TRet
  ): THandlerFunc<TInput, TRet> {
    const timeoutStatus: TimeoutStatus = {
      isTimeout: false,
    }

    const wrapper = async (args: TInput) => {
      try {
        await this.handleStart(args, timeoutStatus)

        if (!this.$inputSchema && !this.$isChained)
          throw new Error("No input schema")

        // parse the input data
        const input = await this.parseInputData(args, timeoutStatus)

        // run the procedure chain to get the context
        const ctx = await this.getProcedureChainOutput(timeoutStatus)

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

    const withTimeout = async (args: TInput) => {
      const timeoutMs = this.$timeout
      if (!timeoutMs) return await wrapper(args)
      return await Promise.race([
        wrapper(args),
        this.getTimeoutErrorPromise(timeoutMs),
      ])
        .then((r) => r)
        .catch((err) => {
          timeoutStatus.isTimeout = true
          return this.handleError(err)
        })
    }

    if (this.$timeout) {
      return withTimeout as any
    }

    return wrapper as any
  }
}

export function createZodSafeFunction(
  isChained?: boolean
): TZodSafeFunction<
  undefined,
  undefined,
  undefined,
  TZodSafeFunctionDefaultOmitted,
  never
> {
  return new ZodSafeFunction({
    inputSchema: undefined,
    outputSchema: undefined,
    isChained,
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
