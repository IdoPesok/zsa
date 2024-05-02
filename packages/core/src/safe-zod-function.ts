import { z } from "zod";
import { SAWError } from "./errors";

export type TDataOrErrorSync<TData> = [TData, null] | [null, SAWError];

export type TDataOrErrorAsync<TData> =
  | Promise<[TData, null]>
  | Promise<[null, SAWError]>;

export type TDataOrError<TData> =
  | TDataOrErrorSync<TData>
  | TDataOrErrorAsync<TData>;

const DefaultOmitted = {
  $inputSchema: 1,
  $outputSchema: 1,
  handler: 1,
  handleError: 1,
  $onInputParseError: 1,
  $onOutputParseError: 1,
  $onError: 1,
  onInputParseError: 1,
  procedureChain: 1,
  getParams: 1,
  getProcedureChainOutput: 1,
  getProcedureChainOutputAsync: 1,
  parseInputData: 1,
  parseOutputData: 1,
  isAsync: 1,
  onOutputParseError: 1,
} as const;

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted;

export type TAnyZodSafeFunctionHandler =
  | ((input: any) => TDataOrError<any>)
  | (() => TDataOrError<any>);

type TAnyZodSafeFunctionSyncHandler =
  | ((input: any) => TDataOrErrorSync<any>)
  | (() => TDataOrErrorSync<any>);

export type TAnyZodSafeFunction = ZodSafeFunction<any, any, any, any, any>;

export type TZodObject = z.ZodDefault<z.AnyZodObject> | z.ZodObject<any>;

export class ZodSafeFunction<
  TInputSchema extends TZodObject | undefined,
  TOutputSchema extends TZodObject | undefined,
  TOmitted extends string,
  TProcedureChainOutput extends any,
  TProcedureAsync extends boolean,
> {
  public $procedureChain: TAnyZodSafeFunctionHandler[] = [];
  public $inputSchema: TInputSchema;
  public $outputSchema: TOutputSchema;
  public $onInputParseError: ((err: any) => any) | undefined;
  public $onOutputParseError: ((err: any) => any) | undefined;
  public $onError: ((err: SAWError) => any) | undefined;
  public $onErrorFromWrapper: ((err: SAWError) => any) | undefined;

  constructor(params: {
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
    onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined;
    onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined;
    onError?: ((err: SAWError) => any) | undefined;
    procedureChain?: TAnyZodSafeFunctionHandler[];
    onErrorFromWrapper?: ((err: SAWError) => any) | undefined;
  }) {
    this.$inputSchema = params.inputSchema;
    this.$outputSchema = params.outputSchema;
    this.$onInputParseError = params.onInputParseError;
    this.$onOutputParseError = params.onOutputParseError;
    this.$onError = params.onError;
    this.$procedureChain = params.procedureChain || [];
    this.$onErrorFromWrapper = params.onErrorFromWrapper;
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
    } as const;
  }

  public getProcedureChainOutput(): TProcedureChainOutput {
    let accData;
    for (let i = 0; i < this.$procedureChain.length; i += 1) {
      const fn = this.$procedureChain[i]! as TAnyZodSafeFunctionSyncHandler;
      const [data, err] = fn(accData);

      if (err) {
        throw err;
      }
      accData = data as any;
    }
    return accData as any;
  }

  public async getProcedureChainOutputAsync(): Promise<TProcedureChainOutput> {
    let accData;
    for (let i = 0; i < this.$procedureChain.length; i += 1) {
      const fn = this.$procedureChain[i]!;
      const [data, err] = await fn(accData);
      if (err) {
        throw err;
      }
      accData = data as any;
    }
    return accData as any;
  }

  public input<T extends TZodObject>(
    schema: T,
  ): Omit<
    ZodSafeFunction<
      T,
      TOutputSchema,
      | "input"
      | "noInputHandler"
      | Exclude<TOmitted, "handler" | "onInputParseError">, // bring back the handler and onInputParseError
      TProcedureChainOutput,
      TProcedureAsync
    >,
    | "input"
    | "noInputHandler"
    | Exclude<TOmitted, "handler" | "onInputParseError">
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      inputSchema: schema,
    }) as any;
  }

  public output<T extends TZodObject>(
    schema: T,
  ): Omit<
    ZodSafeFunction<
      TInputSchema,
      T,
      "output" | Exclude<TOmitted, "onOutputParseError">,
      TProcedureChainOutput,
      TProcedureAsync
    >,
    "output" | Exclude<TOmitted, "onOutputParseError">
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      outputSchema: schema,
    }) as any;
  }

  public onInputParseError(
    fn: (err: z.ZodError<TInputSchema>) => any,
  ): Omit<
    ZodSafeFunction<
      TInputSchema,
      TOutputSchema,
      "onInputParseError" | TOmitted,
      TProcedureChainOutput,
      TProcedureAsync
    >,
    "onInputParseError" | TOmitted
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onInputParseError: fn,
    }) as any;
  }

  public onOutputParseError(
    fn: (err: z.ZodError<TOutputSchema>) => any,
  ): Omit<
    ZodSafeFunction<
      TInputSchema,
      TOutputSchema,
      "onOutputParseError" | TOmitted,
      TProcedureChainOutput,
      TProcedureAsync
    >,
    "onOutputParseError" | TOmitted
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onOutputParseError: fn,
    }) as any;
  }

  public onError(
    fn: (err: SAWError) => any,
  ): Omit<
    ZodSafeFunction<
      TInputSchema,
      TOutputSchema,
      "onError" | TOmitted,
      TProcedureChainOutput,
      TProcedureAsync
    >,
    "onError" | TOmitted
  > {
    return new ZodSafeFunction({
      ...this.getParams(),
      onError: fn,
    }) as any;
  }

  public parseOutputData(
    data: any,
  ): z.output<TOutputSchema extends TZodObject ? TOutputSchema : any> {
    if (!this.$outputSchema) return data;
    const safe = this.$outputSchema.safeParse(data);
    if (!safe.success) {
      if (this.$onOutputParseError) {
        this.$onOutputParseError(safe.error);
      }
      throw new SAWError("OUTPUT_PARSE_ERROR", safe.error);
    }

    return this.$outputSchema.parse(data);
  }

  public handleError(err: any): [null, SAWError] {
    const customError =
      err instanceof SAWError ? err : new SAWError("ERROR", err);
    if (this.$onError) {
      this.$onError(customError);
    }
    if (this.$onErrorFromWrapper) {
      this.$onErrorFromWrapper(customError);
    }
    return [null, customError];
  }

  public parseInputData(
    data: any,
  ): z.input<TInputSchema extends TZodObject ? TInputSchema : any> {
    if (!this.$inputSchema) return data;
    const safe = this.$inputSchema.safeParse(data);
    if (!safe.success) {
      if (this.$onInputParseError) {
        this.$onInputParseError(safe.error);
      }
      throw new SAWError("INPUT_PARSE_ERROR", safe.error);
    }

    return this.$inputSchema.parse(data);
  }

  public isAsync = (func: Function): boolean => {
    return func.constructor.name === "AsyncFunction";
  };

  public noInputHandler<
    TRet extends TOutputSchema extends TZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(
    fn: (v: { ctx: TProcedureChainOutput }) => TRet,
  ): () => TRet extends Promise<any>
    ? TDataOrErrorAsync<TRet>
    : TProcedureAsync extends true
      ? TDataOrErrorAsync<TRet>
      : TDataOrErrorSync<TRet> {
    const wrapper = () => {
      try {
        const ctx = this.getProcedureChainOutput();
        const data = fn({ ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    const wrapperAsync = async () => {
      try {
        const ctx = await this.getProcedureChainOutputAsync();
        const data = await fn({ ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    if (
      this.isAsync(fn) ||
      this.$procedureChain.some((mFN) => this.isAsync(mFN))
    ) {
      return wrapperAsync as any;
    }

    return wrapper as any;
  }

  public handler<
    TRet extends TOutputSchema extends TZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(
    fn: (v: {
      input: z.infer<TInputSchema extends TZodObject ? TInputSchema : z.ZodAny>;
      ctx: TProcedureChainOutput;
    }) => TRet,
  ): (
    args: z.input<TInputSchema extends TZodObject ? TInputSchema : z.ZodAny>,
  ) => TRet extends Promise<any>
    ? TDataOrErrorAsync<TRet>
    : TProcedureAsync extends true
      ? TDataOrErrorAsync<TRet>
      : TDataOrErrorSync<TRet> {
    type TArgs = TInputSchema extends TZodObject ? z.input<TInputSchema> : {};

    const wrapper = (args: TArgs) => {
      try {
        if (!this.$inputSchema) throw new Error("No input schema");
        const ctx = this.getProcedureChainOutput();
        const data = fn({ input: this.parseInputData(args), ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    const wrapperAsync = async (args: TArgs) => {
      try {
        if (!this.$inputSchema) throw new Error("No input schema");
        const ctx = await this.getProcedureChainOutputAsync();
        const data = await fn({ input: this.parseInputData(args), ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    if (
      this.isAsync(fn) ||
      this.$procedureChain.some((mFN) => this.isAsync(mFN))
    ) {
      return wrapperAsync as any;
    }

    return wrapper as any;
  }
}

export function createZodSafeFunction(): Omit<
  ZodSafeFunction<
    undefined,
    undefined,
    TZodSafeFunctionDefaultOmitted,
    never,
    false
  >,
  TZodSafeFunctionDefaultOmitted
> {
  return new ZodSafeFunction({
    inputSchema: undefined,
    outputSchema: undefined,
  }) as any;
}
