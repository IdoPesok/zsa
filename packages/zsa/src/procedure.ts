import z from "zod"
import {
  TOnCompleteFn,
  TOnErrorFn,
  TOnStartFn,
  TOnSuccessFn,
} from "./callbacks"
import {
  RetryConfig,
  TAnyZodSafeFunctionHandler,
  THandlerOpts,
  TZodSafeFunction,
  TZodSafeFunctionDefaultOmitted,
  ZodSafeFunction,
  createZodSafeFunction,
  inferServerActionReturnData,
} from "./zod-safe-function"

/** Internal data stored inside a server action procedure */
export interface TCompleteProcedureInternals<
  TInputSchema extends z.ZodType,
  THandler extends TAnyZodSafeFunctionHandler,
> {
  /** The chained input schema */
  inputSchema: TInputSchema
  /** An ordered array of handlers */
  handlerChain: TAnyZodSafeFunctionHandler[]
  /** The last handler in the chain */
  lastHandler: THandler
  /** The most recent error handler */
  onErrorFn: TOnErrorFn | undefined
  /** The most recent onStart handler */
  onStartFn: TOnStartFn<any, true> | undefined
  /** The most recent onSuccess handler */
  onSuccessFn: TOnSuccessFn<any, any, true> | undefined
  /** The most recent onComplete handler */
  onCompleteFn: TOnCompleteFn<any, any, true> | undefined
  /** The timeout of the procedure */
  timeout: number | undefined
  /** The retry config of the procedure */
  retryConfig: RetryConfig | undefined
}

/** A completed procedure */
export class CompleteProcedure<
  TInputSchema extends z.ZodType,
  THandler extends TAnyZodSafeFunctionHandler,
> {
  $internals: TCompleteProcedureInternals<TInputSchema, THandler>

  constructor(params: TCompleteProcedureInternals<TInputSchema, THandler>) {
    this.$internals = params
  }

  /** make a server action with the current procedure */
  createServerAction(): TZodSafeFunction<
    TInputSchema,
    z.ZodUndefined,
    TInputSchema extends z.ZodUndefined
      ? TZodSafeFunctionDefaultOmitted
      : Exclude<TZodSafeFunctionDefaultOmitted, "input" | "onInputParseError">,
    inferServerActionReturnData<THandler>,
    false,
    "json"
  > {
    return new ZodSafeFunction({
      inputSchema: this.$internals.inputSchema,
      outputSchema: z.undefined(),
      procedureHandlerChain: this.$internals.handlerChain,
      onErrorFromProcedureFn: this.$internals.onErrorFn,
      onStartFromProcedureFn: this.$internals.onStartFn,
      onSuccessFromProcedureFn: this.$internals.onSuccessFn,
      onCompleteFromProcedureFn: this.$internals.onCompleteFn,
      timeout: this.$internals.timeout,
      retryConfig: this.$internals.retryConfig,
    }) as any
  }
}

/** a helper type to hold any complete procedure */
export interface TAnyCompleteProcedure extends CompleteProcedure<any, any> {}

/** The return type of `createServerActionProcedure` given a parent procedure */
type TRet<T extends TAnyCompleteProcedure | undefined> =
  T extends TAnyCompleteProcedure
    ? TZodSafeFunction<
        T["$internals"]["inputSchema"],
        z.ZodUndefined,
        TZodSafeFunctionDefaultOmitted,
        inferServerActionReturnData<T["$internals"]["lastHandler"]>,
        true,
        "json"
      >
    : TZodSafeFunction<
        z.ZodUndefined,
        z.ZodUndefined,
        TZodSafeFunctionDefaultOmitted,
        undefined,
        true,
        "json"
      >

/**
 * Create a server action procedure
 *
 * @param parent optional parent procedure to chain off of
 */
export const createServerActionProcedure = <
  T extends TAnyCompleteProcedure | undefined = undefined,
>(
  parent?: T
): TRet<T> => {
  return createZodSafeFunction(true, parent) as any
}

/**
 * Chain a server action procedure off of another
 *
 * NOTE: the context of the second procedure must extend the context of the first
 *
 * @param first the first procedure to chain off of
 * @param second the second procedure to chain off of
 */
export const chainServerActionProcedures = <
  T2 extends TAnyCompleteProcedure,
  TOpts extends Parameters<T2["$internals"]["lastHandler"]>[2],
  TContext extends TOpts extends { ctx?: any }
    ? NonNullable<TOpts["ctx"]>
    : never,
  T1 extends CompleteProcedure<any, TAnyZodSafeFunctionHandler<TContext>>,
>(
  first: T1,
  second: T2
): CompleteProcedure<
  T1["$internals"]["inputSchema"] extends z.ZodUndefined
    ? T2["$internals"]["inputSchema"]
    : z.ZodIntersection<
        T1["$internals"]["inputSchema"],
        T2["$internals"]["inputSchema"]
      >,
  T2["$internals"]["lastHandler"]
> => {
  let inputSchema =
    first.$internals.inputSchema instanceof z.ZodUndefined
      ? second.$internals.inputSchema
      : first.$internals.inputSchema.and(second.$internals.inputSchema)

  const newLastHandler = async (
    input?: any,
    overrideArgs?: undefined,
    opts?: THandlerOpts<any>
  ) =>
    await second.$internals.lastHandler(input, overrideArgs, {
      ctx: opts?.ctx,
      overrideInputSchema: opts?.overrideInputSchema || inputSchema,
    })

  return new CompleteProcedure({
    inputSchema,
    handlerChain: [...first.$internals.handlerChain, newLastHandler],
    lastHandler: newLastHandler,
    timeout: second.$internals.timeout || first.$internals.timeout,
    retryConfig: second.$internals.retryConfig || first.$internals.retryConfig,
    onErrorFn: second.$internals.onErrorFn || first.$internals.onErrorFn,
    onStartFn: second.$internals.onStartFn || first.$internals.onStartFn,
    onSuccessFn: second.$internals.onSuccessFn || first.$internals.onSuccessFn,
    onCompleteFn:
      second.$internals.onCompleteFn || first.$internals.onCompleteFn,
  })
}
