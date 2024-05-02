import { z } from "zod";
import { ZodSafeFunctionError } from "./errors";

export type TDataOrErrorSync<TData> =
  | [TData, null]
  | [null, ZodSafeFunctionError];

export type TDataOrErrorAsync<TData> =
  | Promise<[TData, null]>
  | Promise<[null, ZodSafeFunctionError]>;

export type TDataOrError<TData> =
  | TDataOrErrorSync<TData>
  | TDataOrErrorAsync<TData>;

export type TZodSafeFunctionDefaultOmitted =
  | "$inputSchema"
  | "$outputSchema"
  | "handler"
  | "$onInputParseError"
  | "$onOutputParseError"
  | "$onError"
  | "onInputParseError"
  | "$middlewareChain"
  | "onOutputParseError";

export type TAnyZodSafeFunctionHandler =
  | ((input: any) => TDataOrError<any>)
  | (() => TDataOrError<any>);

type TAnyZodSafeFunctionSyncHandler =
  | ((input: any) => TDataOrErrorSync<any>)
  | (() => TDataOrErrorSync<any>);

export type TAnyZodSafeFunction = ZodSafeFunction<any, any, any, any, any>;

export class ZodSafeFunction<
  TInputSchema extends z.AnyZodObject | undefined,
  TOutputSchema extends z.AnyZodObject | undefined,
  TOmitted extends string,
  TMiddlewareChainOutput extends any,
  TMiddlewareAsync extends boolean,
> {
  public $middlewareChain: TAnyZodSafeFunctionHandler[] = [];
  public $inputSchema: TInputSchema;
  public $outputSchema: TOutputSchema;
  public $onInputParseError: ((err: any) => any) | undefined;
  public $onOutputParseError: ((err: any) => any) | undefined;
  public $onError: ((err: ZodSafeFunctionError) => any) | undefined;

  constructor(params: {
    inputSchema: TInputSchema;
    outputSchema: TOutputSchema;
    onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined;
    onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined;
    onError?: ((err: ZodSafeFunctionError) => any) | undefined;
    middlewareChain?: TAnyZodSafeFunctionHandler[];
  }) {
    this.$inputSchema = params.inputSchema;
    this.$outputSchema = params.outputSchema;
    this.$onInputParseError = params.onInputParseError;
    this.$onOutputParseError = params.onOutputParseError;
    this.$onError = params.onError;
    this.$middlewareChain = params.middlewareChain || [];
  }

  private getParams() {
    return {
      middlewareChain: this.$middlewareChain,
      inputSchema: this.$inputSchema,
      outputSchema: this.$outputSchema,
      onInputParseError: this.$onInputParseError,
      onOutputParseError: this.$onOutputParseError,
      onError: this.$onError,
    } as const;
  }

  private getMiddlewareChainOutput(): TMiddlewareChainOutput {
    let accData;
    for (let i = 0; i < this.$middlewareChain.length; i += 1) {
      const fn = this.$middlewareChain[i]! as TAnyZodSafeFunctionSyncHandler;
      const [data, err] = fn(accData);

      if (err) {
        throw err;
      }
      accData = data as any;
    }
    return accData as any;
  }

  private async getMiddlewareChainOutputAsync(): Promise<TMiddlewareChainOutput> {
    let accData;
    for (let i = 0; i < this.$middlewareChain.length; i += 1) {
      const fn = this.$middlewareChain[i]!;
      const [data, err] = await fn(accData);

      if (err) {
        throw err;
      }
      accData = data as any;
    }
    return accData as any;
  }

  public input<T extends z.AnyZodObject>(schema: T) {
    type TNewOmitted =
      | "input"
      | "noInputHandler"
      | Exclude<TOmitted, "handler" | "onInputParseError">; // bring back the handler and onInputParseError

    return new ZodSafeFunction({
      ...this.getParams(),
      inputSchema: schema,
    }) as Omit<
      ZodSafeFunction<
        T,
        TOutputSchema,
        TNewOmitted,
        TMiddlewareChainOutput,
        TMiddlewareAsync
      >,
      TNewOmitted
    >;
  }

  public ouptut<T extends z.AnyZodObject>(schema: T) {
    type TNewOmitted = "ouptut" | Exclude<TOmitted, "onOutputParseError">; // no more output
    return new ZodSafeFunction({
      ...this.getParams(),
      outputSchema: schema,
    }) as Omit<
      ZodSafeFunction<
        TInputSchema,
        T,
        TNewOmitted,
        TMiddlewareChainOutput,
        TMiddlewareAsync
      >,
      TNewOmitted
    >;
  }

  public onInputParseError(fn: (err: z.ZodError<TInputSchema>) => any) {
    type TNewOmitted = "onInputParseError" | TOmitted;
    return new ZodSafeFunction({
      ...this.getParams(),
      onInputParseError: fn,
    }) as Omit<
      ZodSafeFunction<
        TInputSchema,
        TOutputSchema,
        TNewOmitted,
        TMiddlewareChainOutput,
        TMiddlewareAsync
      >,
      TNewOmitted
    >;
  }

  public onOutputParseError(fn: (err: z.ZodError<TOutputSchema>) => any) {
    type TNewOmitted = "onOutputParseError" | TOmitted;
    return new ZodSafeFunction({
      ...this.getParams(),
      onOutputParseError: fn,
    }) as Omit<
      ZodSafeFunction<
        TInputSchema,
        TOutputSchema,
        TNewOmitted,
        TMiddlewareChainOutput,
        TMiddlewareAsync
      >,
      TNewOmitted
    >;
  }

  public onError(fn: (err: ZodSafeFunctionError) => any) {
    type TNewOmitted = "onError" | TOmitted;
    return new ZodSafeFunction({
      ...this.getParams(),
      onError: fn,
    }) as Omit<
      ZodSafeFunction<
        TInputSchema,
        TOutputSchema,
        TNewOmitted,
        TMiddlewareChainOutput,
        TMiddlewareAsync
      >,
      TNewOmitted
    >;
  }

  protected parseOutputData(data: any) {
    if (!this.$outputSchema) return data;
    const safe = this.$outputSchema.safeParse(data);
    if (!safe.success) {
      if (this.$onOutputParseError) {
        this.$onOutputParseError(safe.error);
      }
      throw new ZodSafeFunctionError(safe.error, "OUTPUT_PARSE_ERROR");
    }

    return this.$outputSchema.parse(data);
  }

  protected handleError(err: any): [null, ZodSafeFunctionError] {
    const customError =
      err instanceof ZodSafeFunctionError ? err : new ZodSafeFunctionError(err);
    if (this.$onError) {
      this.$onError(customError);
    }
    return [null, customError];
  }

  protected parseInputData(data: any) {
    if (!this.$inputSchema) return data;
    const safe = this.$inputSchema.safeParse(data);
    if (!safe.success) {
      if (this.$onInputParseError) {
        this.$onInputParseError(safe.error);
      }
      throw new ZodSafeFunctionError(safe.error, "INPUT_PARSE_ERROR");
    }

    return this.$inputSchema.parse(data);
  }

  protected isAsync = (func: Function): boolean => {
    return func.constructor.name === "AsyncFunction";
  };

  public noInputHandler<
    TRet extends TOutputSchema extends z.AnyZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(
    fn: (v: { ctx: TMiddlewareChainOutput }) => TRet,
  ): () => TRet extends Promise<any>
    ? TDataOrErrorAsync<TRet>
    : TMiddlewareAsync extends true
      ? TDataOrErrorAsync<TRet>
      : TDataOrErrorSync<TRet> {
    const wrapper = () => {
      try {
        const ctx = this.getMiddlewareChainOutput();
        const data = fn({ ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    const wrapperAsync = async () => {
      try {
        const ctx = await this.getMiddlewareChainOutputAsync();
        const data = await fn({ ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    if (
      this.isAsync(fn) ||
      this.$middlewareChain.some((mFN) => this.isAsync(mFN))
    ) {
      return wrapperAsync as any;
    }

    return wrapper as any;
  }

  public handler<
    TRet extends TOutputSchema extends z.AnyZodObject
      ? z.output<TOutputSchema> | Promise<z.output<TOutputSchema>>
      : any | Promise<any>,
  >(
    fn: (v: {
      input: z.infer<
        TInputSchema extends z.AnyZodObject ? TInputSchema : z.ZodAny
      >;
      ctx: TMiddlewareChainOutput;
    }) => TRet,
  ): (
    args: z.input<
      TInputSchema extends z.AnyZodObject ? TInputSchema : z.ZodAny
    >,
  ) => TRet extends Promise<any>
    ? TDataOrErrorAsync<TRet>
    : TMiddlewareAsync extends true
      ? TDataOrErrorAsync<TRet>
      : TDataOrErrorSync<TRet> {
    type TArgs = TInputSchema extends z.AnyZodObject
      ? z.input<TInputSchema>
      : {};

    const wrapper = (args: TArgs) => {
      try {
        if (!this.$inputSchema) throw new Error("No input schema");
        const ctx = this.getMiddlewareChainOutput();
        const data = fn(this.parseInputData({ input: args, ctx }));
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    const wrapperAsync = async (args: TArgs) => {
      try {
        if (!this.$inputSchema) throw new Error("No input schema");
        const ctx = await this.getMiddlewareChainOutputAsync();
        const data = await fn({ input: this.parseInputData(args), ctx });
        return [this.parseOutputData(data), null];
      } catch (err) {
        return this.handleError(err);
      }
    };

    if (
      this.isAsync(fn) ||
      this.$middlewareChain.some((mFN) => this.isAsync(mFN))
    ) {
      return wrapperAsync as any;
    }

    return wrapper as any;
  }
}

export const createZodSafeFunction = () => {
  return new ZodSafeFunction({
    inputSchema: undefined,
    outputSchema: undefined,
  }) as Omit<
    ZodSafeFunction<
      undefined,
      undefined,
      TZodSafeFunctionDefaultOmitted,
      never,
      false
    >,
    TZodSafeFunctionDefaultOmitted
  >;
};
