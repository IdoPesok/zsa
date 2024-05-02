import { SAWError } from "./errors"
import {
  TAnyZodSafeFunctionHandler,
  TDataOrError,
  TDataOrErrorAsync,
  TZodSafeFunction,
  TZodSafeFunctionDefaultOmitted,
  ZodSafeFunction,
} from "./safe-zod-function"

export interface TCreateAction<
  TProcedureChainOutput extends any,
  TProcedureAsync extends boolean,
> extends TZodSafeFunction<
    undefined,
    undefined,
    TZodSafeFunctionDefaultOmitted,
    TProcedureChainOutput,
    TProcedureAsync
  > {}

export interface TServerActionWrapperInner<
  TProcedureChainOutput extends any,
  TOmitted extends string,
  TProcedureAsync extends boolean,
> extends ServerActionWrapper<
    TProcedureChainOutput,
    TOmitted,
    TProcedureAsync
  > {}

type TServerActionWrapper<
  TProcedureChainOutput extends any,
  TOmitted extends string,
  TProcedureAsync extends boolean,
> = Omit<
  TServerActionWrapperInner<TProcedureChainOutput, TOmitted, TProcedureAsync>,
  TOmitted
>

class ServerActionWrapper<
  TProcedureChainOutput extends any,
  TOmitted extends string,
  TProcedureAsync extends boolean,
> {
  $procedureChain: TAnyZodSafeFunctionHandler[]
  $onError: ((err: SAWError) => any) | undefined

  constructor(params?: {
    procedureChain: TAnyZodSafeFunctionHandler[]
    onError?: ((err: SAWError) => any) | undefined
  }) {
    this.$procedureChain = params?.procedureChain || []
    this.$onError = params?.onError
  }

  public onError(
    fn: (err: SAWError) => any
  ): TServerActionWrapper<
    TProcedureChainOutput,
    TOmitted | "onError",
    TProcedureAsync
  > {
    this.$onError = fn
    return this as any
  }

  public procedure<T extends any>(
    $procedure: () => TDataOrError<T>
  ): TServerActionWrapper<
    Awaited<T>,
    Exclude<TOmitted, "chainProcedure"> | "procedure",
    T extends TDataOrErrorAsync<any> ? true : false
  > {
    return new ServerActionWrapper({
      procedureChain: [$procedure],
      onError: this.$onError,
    }) as any
  }

  public chainProcedure<T extends any>(
    procedure: TProcedureChainOutput extends undefined
      ? () => TDataOrError<T>
      : (input: TProcedureChainOutput) => TDataOrError<T>
  ): TServerActionWrapper<
    Awaited<T>,
    TOmitted,
    T extends TDataOrErrorAsync<any> ? true : TProcedureAsync
  > {
    const temp = [...this.$procedureChain]
    temp.push(procedure)
    return new ServerActionWrapper({
      procedureChain: temp,
      onError: this.$onError,
    }) as any
  }

  public createAction(): TCreateAction<TProcedureChainOutput, TProcedureAsync> {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      procedureChain: this.$procedureChain,
      onErrorFromWrapper: this.$onError,
    }) as any
  }
}

export function createServerActionWrapper(): TServerActionWrapper<
  undefined,
  "$procedureChain" | "chainProcedure" | "$onError",
  false
> {
  return new ServerActionWrapper() as any
}
