import { SAWError } from "./errors"
import {
  TAnyZodSafeFunctionHandler,
  TDataOrError,
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
  TProcedureChainInput extends any,
  TProcedureChainOutput extends any,
  TOmitted extends string,
  TProcedureAsync extends boolean,
> extends ServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted,
    TProcedureAsync
  > {}

type TServerActionWrapper<
  TProcedureChainInput extends any,
  TProcedureChainOutput extends any,
  TOmitted extends string,
  TProcedureAsync extends boolean,
> = Omit<
  TServerActionWrapperInner<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted,
    TProcedureAsync
  >,
  TOmitted
>

class ServerActionWrapper<
  TProcedureChainInput extends any,
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
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted | "onError",
    TProcedureAsync
  > {
    this.$onError = fn
    return this as any
  }

  public procedure<T extends any, TInput extends any>(
    $procedure: (() => TDataOrError<T>) | ((input: TInput) => TDataOrError<T>)
  ): TServerActionWrapper<
    TInput,
    Awaited<T>,
    | Exclude<
        TOmitted,
        TInput extends { [key: string]: any }
          ? "createActionWithProcedureInput" | "chainProcedure"
          : "chainProcedure"
      >
    | (TInput extends { [key: string]: any }
        ? "createAction" | "procedure"
        : "procedure"),
    ReturnType<typeof $procedure> extends Promise<any> ? true : false
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
    TProcedureChainInput,
    Awaited<T>,
    TOmitted,
    ReturnType<typeof procedure> extends Promise<any> ? true : TProcedureAsync
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

  public createActionWithProcedureInput(
    input: TProcedureChainInput
  ): TCreateAction<TProcedureChainOutput, TProcedureAsync> {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      procedureChain: this.$procedureChain,
      onErrorFromWrapper: this.$onError,
      firstProcedureInput: input,
    }) as any
  }
}

export function createServerActionWrapper(): TServerActionWrapper<
  undefined,
  undefined,
  | "$procedureChain"
  | "chainProcedure"
  | "$onError"
  | "createActionWithProcedureInput",
  false
> {
  return new ServerActionWrapper() as any
}
