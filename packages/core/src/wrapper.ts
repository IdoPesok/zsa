import { SAWError } from "./errors";
import {
  TAnyZodSafeFunctionHandler,
  TDataOrError,
  TDataOrErrorAsync,
  TZodSafeFunctionDefaultOmitted,
  ZodSafeFunction,
} from "./safe-zod-function";

export class ServerActionWrapper<
  TProcedureChainOutput extends any,
  TOmitted extends string,
  TProcedureAsync extends boolean,
> {
  $procedureChain: TAnyZodSafeFunctionHandler[] = [];
  $onError: ((err: SAWError) => any) | undefined;

  constructor(params?: {
    procedureChain: TAnyZodSafeFunctionHandler[];
    onError?: ((err: SAWError) => any) | undefined;
  }) {
    this.$procedureChain = params?.procedureChain || [];
    this.$onError = params?.onError;
  }

  public onError(
    fn: (err: SAWError) => any,
  ): Omit<
    ServerActionWrapper<
      TProcedureChainOutput,
      TOmitted | "onError",
      TProcedureAsync
    >,
    TOmitted
  > {
    this.$onError = fn;
    return this as any;
  }

  public procedure<T extends () => TDataOrError<any>>(
    procedure: T,
  ): Omit<
    ServerActionWrapper<
      Awaited<ReturnType<T> extends TDataOrError<infer TData> ? TData : never>,
      Exclude<TOmitted, "chainProcedure"> | "procedure",
      ReturnType<T> extends TDataOrErrorAsync<any> ? true : TProcedureAsync
    >,
    Exclude<TOmitted, "chainProcedure"> | "procedure"
  > {
    this.$procedureChain.push(procedure);
    return new ServerActionWrapper({
      procedureChain: this.$procedureChain,
      onError: this.$onError,
    }) as any;
  }

  public chainProcedure<
    T extends (input: TProcedureChainOutput) => TDataOrError<any>,
  >(
    procedure: T,
  ): Omit<
    ServerActionWrapper<
      Awaited<ReturnType<T> extends TDataOrError<infer TData> ? TData : never>,
      TOmitted,
      ReturnType<T> extends TDataOrErrorAsync<any> ? true : TProcedureAsync
    >,
    TOmitted
  > {
    const temp = [...this.$procedureChain];
    temp.push(procedure);
    return new ServerActionWrapper({
      procedureChain: temp,
      onError: this.$onError,
    }) as any;
  }

  public createAction(): Omit<
    ZodSafeFunction<
      undefined,
      undefined,
      TZodSafeFunctionDefaultOmitted,
      TProcedureChainOutput,
      TProcedureAsync
    >,
    TZodSafeFunctionDefaultOmitted
  > {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      procedureChain: this.$procedureChain,
      onErrorFromWrapper: this.$onError,
    }) as any;
  }
}

export function createServerActionWrapper(): Omit<
  ServerActionWrapper<
    never,
    "$procedureChain" | "chainProcedure" | "$onError",
    false
  >,
  "$procedureChain" | "chainProcedure" | "$onError"
> {
  return new ServerActionWrapper() as any;
}
