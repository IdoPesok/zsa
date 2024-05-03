import {
  TAnyZodSafeFunctionHandler,
  TDataOrError,
  TOnCompleteFnFromWrapper,
  TOnErrorFnFromWrapper,
  TOnStartFnFromWrapper,
  TOnSuccessFnFromWrapper,
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

type TId = string | undefined

class ServerActionWrapper<
  TProcedureChainInput extends any,
  TProcedureChainOutput extends any,
  TOmitted extends string,
> {
  $procedureChain: TAnyZodSafeFunctionHandler[]
  $onError: TOnErrorFnFromWrapper | undefined
  $onStart: TOnStartFnFromWrapper | undefined
  $onSuccess: TOnSuccessFnFromWrapper | undefined
  $onComplete: TOnCompleteFnFromWrapper | undefined

  constructor(params?: {
    procedureChain: TAnyZodSafeFunctionHandler[]
    onError?: TOnErrorFnFromWrapper | undefined
    onStart?: TOnStartFnFromWrapper | undefined
    onSuccess?: TOnSuccessFnFromWrapper | undefined
    onComplete?: TOnCompleteFnFromWrapper | undefined
  }) {
    this.$procedureChain = params?.procedureChain || []
    this.$onError = params?.onError
    this.$onStart = params?.onStart
    this.$onSuccess = params?.onSuccess
    this.$onComplete = params?.onComplete
  }

  public onError(
    fn: TOnErrorFnFromWrapper
  ): TServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted | "onError"
  > {
    this.$onError = fn
    return this as any
  }

  public onStart(
    fn: TOnStartFnFromWrapper
  ): TServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted | "onStart"
  > {
    this.$onStart = fn
    return this as any
  }

  public onSuccess(
    fn: TOnSuccessFnFromWrapper
  ): TServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted | "onSuccess"
  > {
    this.$onSuccess = fn
    return this as any
  }

  public onComplete(
    fn: TOnCompleteFnFromWrapper
  ): TServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted | "onComplete"
  > {
    this.$onComplete = fn
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
      onStart: this.$onStart,
      onSuccess: this.$onSuccess,
      onComplete: this.$onComplete,
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
      onStart: this.$onStart,
      onSuccess: this.$onSuccess,
      onComplete: this.$onComplete,
    }) as any
  }

  public createAction(): TCreateAction<TProcedureChainOutput> {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      procedureChain: this.$procedureChain,
      onErrorFromWrapper: this.$onError,
      onStartFromWrapper: this.$onStart,
      onSuccessFromWrapper: this.$onSuccess,
      onCompleteFromWrapper: this.$onComplete,
    }) as any
  }

  public createActionWithProcedureInput(
    input: TProcedureChainInput
  ): TCreateAction<TProcedureChainOutput> {
    return new ZodSafeFunction({
      inputSchema: undefined,
      outputSchema: undefined,
      procedureChain: this.$procedureChain,
      firstProcedureInput: input,
      onErrorFromWrapper: this.$onError,
      onSuccessFromWrapper: this.$onSuccess,
      onCompleteFromWrapper: this.$onComplete,
      onStartFromWrapper: this.$onStart,
    }) as any
  }
}

export function createServerActionWrapper(): TServerActionWrapper<
  undefined,
  undefined,
  | "$procedureChain"
  | "chainProcedure"
  | "$onError"
  | "$onSuccess"
  | "$onComplete"
  | "$onStart"
  | "createActionWithProcedureInput"
> {
  return new ServerActionWrapper() as any
}
