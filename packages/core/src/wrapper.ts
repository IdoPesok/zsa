import {
  TAnyObject,
  TAnyZodSafeFunctionHandler,
  TDataOrError,
  TFinalInput,
  TOnCompleteFnFromWrapper,
  TOnErrorFnFromWrapper,
  TOnStartFnFromWrapper,
  TOnSuccessFnFromWrapper,
  TZodSafeFunction,
  TZodSafeFunctionDefaultOmitted,
  ZodSafeFunction,
} from "./safe-zod-function"

export type TCreateAction<
  TInput extends TAnyObject | undefined,
  TParsedInput extends TAnyObject | undefined,
  TProcedureChainOutput extends any,
> = TZodSafeFunction<
  TInput,
  TParsedInput,
  undefined,
  TInput extends TAnyObject
    ? Exclude<TZodSafeFunctionDefaultOmitted, "handler"> | "noInputHandler"
    : TZodSafeFunctionDefaultOmitted,
  TProcedureChainOutput,
  false
>

export interface TServerActionWrapperInner<
  TProcedureChainInput extends TAnyObject | undefined,
  TProcedureChainParsedInput extends TAnyObject | undefined,
  TProcedureChainOutput extends any,
  TOmitted extends string,
> extends ServerActionWrapper<
    TProcedureChainInput,
    TProcedureChainParsedInput,
    TProcedureChainOutput,
    TOmitted
  > {}

type TServerActionWrapper<
  TProcedureChainInput extends TAnyObject | undefined,
  TProcedureChainParsedInput extends TAnyObject | undefined,
  TProcedureChainOutput extends any,
  TOmitted extends string,
> = Omit<
  TServerActionWrapperInner<
    TProcedureChainInput,
    TProcedureChainParsedInput,
    TProcedureChainOutput,
    TOmitted
  >,
  TOmitted
>

class ServerActionWrapper<
  TProcedureChainInput extends TAnyObject | undefined,
  TProcedureChainParsedInput extends TAnyObject | undefined,
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
    TProcedureChainParsedInput,
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
    TProcedureChainParsedInput,
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
    TProcedureChainParsedInput,
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
    TProcedureChainParsedInput,
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
    TProcedureChainParsedInput,
    TProcedureChainOutput,
    TOmitted | "onComplete"
  > {
    this.$onComplete = fn
    return this as any
  }

  public procedure<
    T extends any,
    TInput extends TAnyObject | undefined = undefined,
    TParsedInput extends TAnyObject | undefined = undefined,
  >(
    $procedure:
      | (() => TDataOrError<T>)
      | ((
          input: TInput,
          ctx: any,
          parsedInput: TParsedInput
        ) => TDataOrError<T>)
  ): TServerActionWrapper<
    TInput,
    TParsedInput,
    Awaited<T>,
    Exclude<TOmitted, "chainProcedure"> | "procedure"
  > {
    return new ServerActionWrapper({
      ...this.getParams(),
      procedureChain: [$procedure],
    }) as any
  }

  public chainProcedure<
    T extends any,
    TInput extends TAnyObject | undefined = undefined,
    TParsedInput extends TAnyObject | undefined = undefined,
  >(
    procedure: TProcedureChainOutput extends undefined
      ? () => TDataOrError<T>
      : (
          input: TInput,
          ctx: TProcedureChainOutput,
          parsedInput: TParsedInput
        ) => TDataOrError<T>
  ): TServerActionWrapper<
    TFinalInput<TProcedureChainInput, TInput>,
    TFinalInput<
      TProcedureChainParsedInput,
      Exclude<TParsedInput, undefined> extends never
        ? undefined
        : Exclude<TParsedInput, undefined>
    >,
    Awaited<T>,
    TOmitted
  > {
    const temp = [...this.$procedureChain]
    temp.push(procedure)
    return new ServerActionWrapper({
      ...this.getParams(),
      procedureChain: temp,
    }) as any
  }

  public createAction(): TCreateAction<
    TProcedureChainInput,
    TProcedureChainParsedInput,
    TProcedureChainOutput
  > {
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
}

export function createServerActionWrapper(): TServerActionWrapper<
  undefined,
  undefined,
  undefined,
  | "$procedureChain"
  | "chainProcedure"
  | "$onError"
  | "$timeout"
  | "$onSuccess"
  | "$onComplete"
  | "$onStart"
> {
  return new ServerActionWrapper() as any
}

export function createServerAction() {
  return createServerActionWrapper().createAction()
}
