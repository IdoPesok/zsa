import { z } from "zod"
import { SAWError, TSAWError } from "./errors"

export type TDataOrError<TData> =
  | Promise<[Awaited<TData>, null]>
  | Promise<[null, TSAWError]>

type TNoHandlerFunc<TRet extends any> = () => TDataOrError<TRet>

type THandlerFunc<
  TInputSchema extends TZodObject | undefined,
  TRet extends any,
> = (
  args: z.input<TInputSchema extends TZodObject ? TInputSchema : z.ZodAny>
) => TDataOrError<TRet>

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
  procedureChain: 1,
  getParams: 1,
  getProcedureChainOutput: 1,
  handleSuccess: 1,
  handleStart: 1,
  parseInputData: 1,
  parseOutputData: 1,
  onOutputParseError: 1,
  $procedureChain: 1,
  $firstProcedureInput: 1,
  $id: 1,
  $onStartFn: 1,
  $onSuccessFn: 1,
  $onCompleteFn: 1,
} as const

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted

export type TAnyZodSafeFunctionHandler =
  | ((input: any) => TDataOrError<any>)
  | (() => TDataOrError<any>)

export type TAnyZodSafeFunction = ZodSafeFunction<any, any, any, any>

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
> extends ZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted,
    TProcedureChainOutput
  > {}

export type TZodSafeFunction<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
> = Omit<
  TZodSafeFunctionInner<
    TInputSchema,
    TOutputSchema,
    TOmitted,
    TProcedureChainOutput
  >,
  TOmitted
>

interface TOnStartFn<TInputSchema extends TZodObject | undefined> {
  (value: {
    args: TInputSchema extends TZodObject ? z.input<TInputSchema> : undefined
  }): any
}

interface TOnSuccessFn<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
> {
  (value: {
    args: TInputSchema extends TZodObject ? z.input<TInputSchema> : undefined
    data: TOutputSchema extends TZodObject ? z.output<TOutputSchema> : any
  }): any
}

interface TOnCompleteFn<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
> {
  (
    value:
      | {
          isSuccess: true
          isError: false
          status: "success"
          args: TInputSchema extends TZodObject
            ? z.input<TInputSchema>
            : undefined
          data: TOutputSchema extends TZodObject ? z.output<TOutputSchema> : any
        }
      | {
          isSuccess: false
          isError: true
          status: "error"
          error: SAWError
        }
  ): any
}

export class ZodSafeFunction<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
> {
  public $procedureChain: TAnyZodSafeFunctionHandler[] = []
  public $inputSchema: TInputSchema
  public $outputSchema: TOutputSchema
  public $onInputParseError: ((err: any) => any) | undefined
  public $onOutputParseError: ((err: any) => any) | undefined
  public $onError: ((err: SAWError) => any) | undefined
  public $onErrorFromWrapper: ((err: SAWError) => any) | undefined
  public $firstProcedureInput: any
  public $id: string | undefined

  public $onStartFn: TOnStartFn<TInputSchema> | undefined
  public $onSuccessFn: TOnSuccessFn<TInputSchema, TOutputSchema> | undefined
  public $onCompleteFn: TOnCompleteFn<TInputSchema, TOutputSchema> | undefined

  constructor(params: {
    inputSchema: TInputSchema
    outputSchema: TOutputSchema
    onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined
    onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined
    onError?: ((err: SAWError) => any) | undefined
    procedureChain?: TAnyZodSafeFunctionHandler[]
    onErrorFromWrapper?: ((err: SAWError) => any) | undefined
    firstProcedureInput?: any
    onStart?: TOnStartFn<TInputSchema> | undefined
    onSuccess?: TOnSuccessFn<TInputSchema, TOutputSchema> | undefined
    onComplete?: TOnCompleteFn<TInputSchema, TOutputSchema> | undefined
    id?: string | undefined
  }) {
    this.$inputSchema = params.inputSchema
    this.$outputSchema = params.outputSchema
    this.$onInputParseError = params.onInputParseError
    this.$onOutputParseError = params.onOutputParseError
    this.$onError = params.onError
    this.$procedureChain = params.procedureChain || []
    this.$onErrorFromWrapper = params.onErrorFromWrapper
    this.$firstProcedureInput = params.firstProcedureInput
    this.$onStartFn = params.onStart
    this.$id = params.id
    this.$onSuccessFn = params.onSuccess
    this.$onCompleteFn = params.onComplete
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
      id: this.$id,
      onStart: this.$onStartFn,
      onSuccess: this.$onSuccessFn,
      onComplete: this.$onCompleteFn,
    } as const
  }

  public async getProcedureChainOutput(): Promise<TProcedureChainOutput> {
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

  public id<T extends string>(
    id: T
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
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
    T,
    TOutputSchema,
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
    TInputSchema,
    T,
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
    fn: (err: z.ZodError<TInputSchema>) => any
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    "onInputParseError" | TOmitted,
    TProcedureChainOutput
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
    TInputSchema,
    TOutputSchema,
    "onError" | TOmitted,
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onError: fn,
    }) as any
  }

  public onStart(
    fn: TOnStartFn<TInputSchema>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted | "onStart",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onStart: fn,
    }) as any
  }

  public onSuccess(
    fn: TOnSuccessFn<TInputSchema, TOutputSchema>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted | "onSuccess",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onSuccess: fn,
    }) as any
  }

  public onComplete(
    fn: TOnCompleteFn<TInputSchema, TOutputSchema>
  ): TZodSafeFunction<
    TInputSchema,
    TOutputSchema,
    TOmitted | "onComplete",
    TProcedureChainOutput
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onComplete: fn,
    }) as any
  }

  public async parseOutputData(
    data: any
  ): Promise<z.output<TOutputSchema extends TZodObject ? TOutputSchema : any>> {
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

  public async handleStart(args: any) {
    if (!this.$onStartFn) return
    await this.$onStartFn({
      args,
    })
  }

  public async handleSuccess(args: any, data: any) {
    if (this.$onSuccessFn) {
      await this.$onSuccessFn({
        args,
        data,
      })
    }

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
      await this.$onErrorFromWrapper(customError)
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
    data: any
  ): Promise<z.input<TInputSchema extends TZodObject ? TInputSchema : any>> {
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

  public noInputHandler<
    TRet extends TOutputSchema extends TZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(fn: (v: { ctx: TProcedureChainOutput }) => TRet): TNoHandlerFunc<TRet> {
    const wrapper = async () => {
      try {
        await this.handleStart(undefined)

        const ctx = await this.getProcedureChainOutput()
        const data = await fn({ ctx })
        const parsed = await this.parseOutputData(data)

        await this.handleSuccess(undefined, parsed)

        return [parsed, null]
      } catch (err) {
        return await this.handleError(err)
      }
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
  ): THandlerFunc<TInputSchema, TRet> {
    type TArgs = TInputSchema extends TZodObject ? z.input<TInputSchema> : {}

    const wrapper = async (args: TArgs) => {
      try {
        await this.handleStart(args)

        if (!this.$inputSchema) throw new Error("No input schema")
        const ctx = await this.getProcedureChainOutput()
        const data = await fn({
          input: await this.parseInputData(args),
          ctx,
        })
        const parsed = await this.parseOutputData(data)

        await this.handleSuccess(args, parsed)

        return [parsed, null]
      } catch (err) {
        return await this.handleError(err)
      }
    }

    return wrapper as any
  }
}

export function createZodSafeFunction(): TZodSafeFunction<
  undefined,
  undefined,
  TZodSafeFunctionDefaultOmitted,
  never
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
