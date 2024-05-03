import { SAWError } from "./errors"
import {
  TAnyZodSafeFunctionHandler,
  TDataOrError,
  TZodSafeFunction,
  TZodSafeFunctionDefaultOmitted,
  ZodSafeFunction,
} from "./safe-zod-function"

export interface TCreateAction<TProcedureChainOutput extends any>
  extends TZodSafeFunction<
    undefined,
    undefined,
    TZodSafeFunctionDefaultOmitted,
    TProcedureChainOutput
  > {}

export interface TServerActionWrapperInner<
  TProcedureChainInput extends any,
  TProcedureChainOutput extends any,
  TOmitted extends string,
> extends ServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted
  > {}

type TServerActionWrapper<
  TProcedureChainInput extends any,
  TProcedureChainOutput extends any,
  TOmitted extends string,
> = Omit<
  TServerActionWrapperInner<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted
  >,
  TOmitted
>

class ServerActionWrapper<
  TProcedureChainInput extends any,
  TProcedureChainOutput extends any,
  TOmitted extends string,
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
    TOmitted | "onError"
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
        : "procedure")
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
  ): TServerActionWrapper<TProcedureChainInput, Awaited<T>, TOmitted> {
    const temp = [...this.$procedureChain]
    temp.push(procedure)
    return new ServerActionWrapper({
      procedureChain: temp,
      onError: this.$onError,
    }) as any
  }

  public createAction(): TCreateAction<TProcedureChainOutput> {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      procedureChain: this.$procedureChain,
      onErrorFromWrapper: this.$onError,
    }) as any
  }

  public createActionWithProcedureInput(
    input: TProcedureChainInput
  ): TCreateAction<TProcedureChainOutput> {
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
  | "createActionWithProcedureInput"
> {
  return new ServerActionWrapper() as any
}
