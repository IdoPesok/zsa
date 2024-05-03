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
  $timeout: number | undefined

  constructor(params?: {
    procedureChain: TAnyZodSafeFunctionHandler[]
    onError?: TOnErrorFnFromWrapper | undefined
    onStart?: TOnStartFnFromWrapper | undefined
    onSuccess?: TOnSuccessFnFromWrapper | undefined
    onComplete?: TOnCompleteFnFromWrapper | undefined
    timeout?: number | undefined
  }) {
    this.$procedureChain = params?.procedureChain || []
    this.$onError = params?.onError
    this.$onStart = params?.onStart
    this.$onSuccess = params?.onSuccess
    this.$onComplete = params?.onComplete
    this.$timeout = params?.timeout
  }

  public getParams() {
    return {
      onError: this.$onError,
      onStart: this.$onStart,
      onSuccess: this.$onSuccess,
      onComplete: this.$onComplete,
      timeout: this.$timeout,
    } as const
  }

  public timeout<T extends number>(
    milliseconds: T
  ): TServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainOutput,
    TOmitted | "timeout"
  > {
    this.$timeout = milliseconds
    return this as any
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
      ...this.getParams(),
      procedureChain: [$procedure],
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
      ...this.getParams(),
      procedureChain: temp,
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
      timeout: this.$timeout,
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
      timeout: this.$timeout,
    }) as any
  }
}

export function createServerActionWrapper(): TServerActionWrapper<
  undefined,
  undefined,
  | "$procedureChain"
  | "chainProcedure"
  | "$onError"
  | "$timeout"
  | "$onSuccess"
  | "$onComplete"
  | "$onStart"
  | "createActionWithProcedureInput"
> {
  return new ServerActionWrapper() as any
}

export function createServerAction() {
  return createServerActionWrapper().createAction()
}
