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
  TZodSafeFunctionDefaultOmitted,
} from "./types"
import { mergeArraysAndRemoveDuplicates } from "./utils"
import {
  TZodSafeFunction,
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
  /** A chain of error handlers */
  onErrorFns: Array<TOnErrorFn> | undefined
  /** A chain of start handlers */
  onStartFns: Array<TOnStartFn<any, true>> | undefined
  /** A chain of success handlers */
  onSuccessFns: Array<TOnSuccessFn<any, any, true>> | undefined
  /** A chain of complete handlers */
  onCompleteFns: Array<TOnCompleteFn<any, any, true>> | undefined
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
      onErrorFromProcedureFn: this.$internals.onErrorFns,
      onStartFromProcedureFn: this.$internals.onStartFns,
      onSuccessFromProcedureFn: this.$internals.onSuccessFns,
      onCompleteFromProcedureFn: this.$internals.onCompleteFns,
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
        inferServerActionReturnData<
          T["$internals"]["lastHandler"]
        > extends infer TData
          ? TData extends void
            ? undefined
            : TData
          : never,
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
    : undefined,
  T1 extends CompleteProcedure<any, TAnyZodSafeFunctionHandler<any, TContext>>,
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
      ...opts,
      overrideInputSchema: opts?.overrideInputSchema || inputSchema,
    })

  return new CompleteProcedure({
    inputSchema,
    handlerChain: [...first.$internals.handlerChain, newLastHandler],
    lastHandler: newLastHandler,
    timeout: second.$internals.timeout || first.$internals.timeout,
    retryConfig: second.$internals.retryConfig || first.$internals.retryConfig,
    onErrorFns: mergeArraysAndRemoveDuplicates(
      first.$internals.onErrorFns,
      second.$internals.onErrorFns
    ),
    onStartFns: mergeArraysAndRemoveDuplicates(
      first.$internals.onStartFns,
      second.$internals.onStartFns
    ),
    onSuccessFns: mergeArraysAndRemoveDuplicates(
      first.$internals.onSuccessFns,
      second.$internals.onSuccessFns
    ),
    onCompleteFns: mergeArraysAndRemoveDuplicates(
      first.$internals.onCompleteFns,
      second.$internals.onCompleteFns
    ),
  })
}
