import { z } from "zod"
import { SAWError, TSAWError } from "./errors"

export type TDataOrErrorSync<TData> = [TData, null] | [null, TSAWError]

export type TDataOrErrorAsync<TData> =
  | Promise<[Awaited<TData>, null]>
  | Promise<[null, TSAWError]>

export type TDataOrError<TData> =
  TData extends Promise<any>
    ? TDataOrErrorAsync<TData>
    : TDataOrErrorSync<TData>

type TNoHandlerFunc<
  TRet extends any,
  TProcedureAsync extends boolean,
> = () => TRet extends Promise<any>
  ? TDataOrErrorAsync<TRet>
  : TProcedureAsync extends true
    ? TDataOrErrorAsync<TRet>
    : TDataOrErrorSync<TRet>

type THandlerFunc<
  TInputSchema extends TZodObject | undefined,
  TRet extends any,
  TProcedureAsync extends boolean,
> = (
  args: z.input<TInputSchema extends TZodObject ? TInputSchema : z.ZodAny>
) => TRet extends Promise<any>
  ? TDataOrErrorAsync<TRet>
  : TProcedureAsync extends true
    ? TDataOrErrorAsync<TRet>
    : TDataOrErrorSync<TRet>

const DefaultOmitted = {
  $inputSchema: 1,
  $outputSchema: 1,
  handler: 1,
  handleError: 1,
  $onInputParseError: 1,
  $onOutputParseError: 1,
  $onError: 1,
  onInputParseError: 1,
  parseInputDataAsync: 1,
  parseOutputDataAsync: 1,
  $onErrorFromWrapper: 1,
  procedureChain: 1,
  getParams: 1,
  getProcedureChainOutput: 1,
  getProcedureChainOutputAsync: 1,
  parseInputData: 1,
  parseOutputData: 1,
  isAsync: 1,
  onOutputParseError: 1,
  $procedureChain: 1,
  $firstProcedureInput: 1,
} as const

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted

export type TAnyZodSafeFunctionHandler =
  | ((input: any) => TDataOrError<any>)
  | (() => TDataOrError<any>)

type TAnyZodSafeFunctionSyncHandler =
  | ((input: any) => TDataOrErrorSync<any>)
  | (() => TDataOrErrorSync<any>)

export type TAnyZodSafeFunction = ZodSafeFunction<any, any, any, any, any>

export type TZodObject =
  | z.ZodDefault<z.AnyZodObject>
  | z.ZodObject<any>
  | z.ZodOptional<z.AnyZodObject>
  | z.ZodEffects<z.AnyZodObject>

interface TZodSafeFunctionInner<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TProcedureAsync extends boolean,
> extends ZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted,
    TProcedureChainOutput,
    TProcedureAsync
  > {}

export type TZodSafeFunction<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TProcedureAsync extends boolean,
> = Omit<
  TZodSafeFunctionInner<
    TInputSchema,
    TOutputSchema,
    TOmitted,
    TProcedureChainOutput,
    TProcedureAsync
  >,
  TOmitted
>

export class ZodSafeFunction<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TProcedureAsync extends boolean,
> {
  public $procedureChain: TAnyZodSafeFunctionHandler[] = []
  public $inputSchema: TInputSchema
  public $outputSchema: TOutputSchema
  public $onInputParseError: ((err: any) => any) | undefined
  public $onOutputParseError: ((err: any) => any) | undefined
  public $onError: ((err: SAWError) => any) | undefined
  public $onErrorFromWrapper: ((err: SAWError) => any) | undefined
  public $firstProcedureInput: any

  constructor(params: {
    inputSchema: TInputSchema
    outputSchema: TOutputSchema
    onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined
    onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined
    onError?: ((err: SAWError) => any) | undefined
    procedureChain?: TAnyZodSafeFunctionHandler[]
    onErrorFromWrapper?: ((err: SAWError) => any) | undefined
    firstProcedureInput?: any
  }) {
    this.$inputSchema = params.inputSchema
    this.$outputSchema = params.outputSchema
    this.$onInputParseError = params.onInputParseError
    this.$onOutputParseError = params.onOutputParseError
    this.$onError = params.onError
    this.$procedureChain = params.procedureChain || []
    this.$onErrorFromWrapper = params.onErrorFromWrapper
    this.$firstProcedureInput = params.firstProcedureInput
  }

  public getParams() {
    return {
      procedureChain: this.$procedureChain,
      inputSchema: this.$inputSchema,
      outputSchema: this.$outputSchema,
      onInputParseError: this.$onInputParseError,
      onOutputParseError: this.$onOutputParseError,
      onError: this.$onError,
      onErrorFromWrapper: this.$onErrorFromWrapper,
      firstProcedureInput: this.$firstProcedureInput,
    } as const
  }

  public getProcedureChainOutput(): TProcedureChainOutput {
    let accData = this.$firstProcedureInput
    for (let i = 0; i < this.$procedureChain.length; i += 1) {
      const fn = this.$procedureChain[i]! as TAnyZodSafeFunctionSyncHandler
      const [data, err] = fn(accData)

      if (err) {
        throw err
      }
      accData = data as any
    }
    return accData as any
  }

  public async getProcedureChainOutputAsync(): Promise<TProcedureChainOutput> {
    let accData = this.$firstProcedureInput
    for (let i = 0; i < this.$procedureChain.length; i += 1) {
      const fn = this.$procedureChain[i]!
      const [data, err] = await fn(accData)
      if (err) {
        throw err
      }
      accData = data as any
    }
    return accData as any
  }

  public input<T extends TZodObject>(
    schema: T
  ): TZodSafeFunction<
    T,
    TOutputSchema,
    | "input"
    | "noInputHandler"
    | Exclude<TOmitted, "handler" | "onInputParseError">, // bring back the handler and onInputParseError
    TProcedureChainOutput,
    TProcedureAsync
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      inputSchema: schema,
    }) as any
  }

  public output<T extends TZodObject>(
    schema: T
  ): TZodSafeFunction<
    TInputSchema,
    T,
    "output" | Exclude<TOmitted, "onOutputParseError">,
    TProcedureChainOutput,
    TProcedureAsync
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      outputSchema: schema,
    }) as any
  }

  public onInputParseError(
    fn: (err: z.ZodError<TInputSchema>) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    "onInputParseError" | TOmitted,
    TProcedureChainOutput,
    TProcedureAsync
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onInputParseError: fn,
    }) as any
  }

  public onOutputParseError(
    fn: (err: z.ZodError<TOutputSchema>) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    "onOutputParseError" | TOmitted,
    TProcedureChainOutput,
    TProcedureAsync
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
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
    TProcedureAsync
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onError: fn,
    }) as any
  }

  public async parseOutputDataAsync(
    data: any
  ): Promise<z.output<TOutputSchema extends TZodObject ? TOutputSchema : any>> {
    if (!this.$outputSchema) return data
    const safe = await this.$outputSchema.safeParseAsync(data)
    if (!safe.success) {
      if (this.$onOutputParseError) {
        this.$onOutputParseError(safe.error)
      }
      throw new SAWError("OUTPUT_PARSE_ERROR", safe.error)
    }
    return safe.data
  }

  public parseOutputData(
    data: any
  ): z.output<TOutputSchema extends TZodObject ? TOutputSchema : any> {
    if (!this.$outputSchema) return data
    const safe = this.$outputSchema.safeParse(data)
    if (!safe.success) {
      if (this.$onOutputParseError) {
        this.$onOutputParseError(safe.error)
      }
      throw new SAWError("OUTPUT_PARSE_ERROR", safe.error)
    }
    return safe.data
  }

  public handleError(err: any): [null, TSAWError] {
    const customError =
      err instanceof SAWError ? err : new SAWError("ERROR", err)
    if (this.$onError) {
      this.$onError(customError)
    }
    if (this.$onErrorFromWrapper) {
      this.$onErrorFromWrapper(customError)
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

  public parseInputData(
    data: any
  ): z.input<TInputSchema extends TZodObject ? TInputSchema : any> {
    if (!this.$inputSchema) return data
    const safe = this.$inputSchema.safeParse(data)
    if (!safe.success) {
      if (this.$onInputParseError) {
        this.$onInputParseError(safe.error)
      }
      throw new SAWError("INPUT_PARSE_ERROR", safe.error)
    }

    return safe.data
  }

  public async parseInputDataAsync(
    data: any
  ): Promise<z.input<TInputSchema extends TZodObject ? TInputSchema : any>> {
    if (!this.$inputSchema) return data
    const safe = await this.$inputSchema.safeParseAsync(data)
    if (!safe.success) {
      if (this.$onInputParseError) {
        this.$onInputParseError(safe.error)
      }
      throw new SAWError("INPUT_PARSE_ERROR", safe.error)
    }

    return safe.data
  }

  public isAsync = (func: Function): boolean => {
    return func.constructor.name === "AsyncFunction"
  }

  public noInputHandler<
    TRet extends TOutputSchema extends TZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(
    fn: (v: { ctx: TProcedureChainOutput }) => TRet
  ): TNoHandlerFunc<TRet, TProcedureAsync> {
    const wrapper = () => {
      try {
        const ctx = this.getProcedureChainOutput()
        const data = fn({ ctx })
        return [this.parseOutputData(data), null]
      } catch (err) {
        return this.handleError(err)
      }
    }

    const wrapperAsync = async () => {
      try {
        const ctx = await this.getProcedureChainOutputAsync()
        const data = await fn({ ctx })
        const parsed = await this.parseOutputDataAsync(data)
        return [parsed, null]
      } catch (err) {
        return this.handleError(err)
      }
    }

    if (
      this.isAsync(fn) ||
      this.$procedureChain.some((mFN) => this.isAsync(mFN))
    ) {
      return wrapperAsync as any
    }

    return wrapper as any
  }

  public handler<
    TRet extends TOutputSchema extends TZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(
    fn: (v: {
      input: z.infer<TInputSchema extends TZodObject ? TInputSchema : z.ZodAny>
      ctx: TProcedureChainOutput
    }) => TRet
  ): THandlerFunc<TInputSchema, TRet, TProcedureAsync> {
    type TArgs = TInputSchema extends TZodObject ? z.input<TInputSchema> : {}

    const wrapper = (args: TArgs) => {
      try {
        if (!this.$inputSchema) throw new Error("No input schema")
        const ctx = this.getProcedureChainOutput()
        const data = fn({ input: this.parseInputData(args), ctx })
        return [this.parseOutputData(data), null]
      } catch (err) {
        return this.handleError(err)
      }
    }

    const wrapperAsync = async (args: TArgs) => {
      try {
        if (!this.$inputSchema) throw new Error("No input schema")
        const ctx = await this.getProcedureChainOutputAsync()
        const data = await fn({
          input: await this.parseInputDataAsync(args),
          ctx,
        })
        const parsed = await this.parseOutputDataAsync(data)
        return [parsed, null]
      } catch (err) {
        return this.handleError(err)
      }
    }

    if (
      this.isAsync(fn) ||
      this.$procedureChain.some((mFN) => this.isAsync(mFN))
    ) {
      return wrapperAsync as any
    }

    return wrapper as any
  }
}

export function createZodSafeFunction(): TZodSafeFunction<
  undefined,
  undefined,
  TZodSafeFunctionDefaultOmitted,
  never,
  false
> {
  return new ZodSafeFunction({
    inputSchema: undefined,
    outputSchema: undefined,
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
