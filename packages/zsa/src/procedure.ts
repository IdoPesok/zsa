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
  TInputSchemaFn,
  TShapeErrorFn,
  TShapeErrorNotSet,
  TZodMerge,
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
  TInputSchema extends z.ZodType | undefined,
  THandler extends TAnyZodSafeFunctionHandler,
> {
  /** The chained input schema */
  inputSchema: TInputSchemaFn<any, any> | TInputSchema
  /** The final static input schema of the handler */
  staticMergedInputSchema?: any
  /** An ordered array of handlers */
  handlerChain: TAnyZodSafeFunctionHandler[]
  /** The last handler in the chain */
  lastHandler: THandler
  /** A chain of error handlers */
  onErrorFns: Array<TOnErrorFn<any, true>> | undefined
  /** A chain of start handlers */
  onStartFns: Array<TOnStartFn<any, true>> | undefined
  /** A chain of success handlers */
  onSuccessFns: Array<TOnSuccessFn<any, any, true>> | undefined
  /** A chain of complete handlers */
  onCompleteFns: Array<TOnCompleteFn<any, any, any, true>> | undefined
  /** The timeout of the procedure */
  timeout: number | undefined
  /** The retry config of the procedure */
  retryConfig: RetryConfig | undefined
  /** A function to run when the handler errors to customize the error */
  shapeErrorFns: Array<TShapeErrorFn> | undefined
}

/** A completed procedure */
export class CompleteProcedure<
  TInputSchema extends z.ZodType | undefined,
  THandler extends TAnyZodSafeFunctionHandler,
  TError extends any,
> {
  $internals: TCompleteProcedureInternals<TInputSchema, THandler>

  constructor(params: TCompleteProcedureInternals<TInputSchema, THandler>) {
    this.$internals = params
  }

  /** make a server action with the current procedure */
  createServerAction(): TZodSafeFunction<
    TInputSchema,
    undefined,
    TError,
    TZodSafeFunctionDefaultOmitted,
    inferServerActionReturnData<THandler>,
    false,
    "json"
  > {
    return new ZodSafeFunction({
      inputSchema: this.$internals.inputSchema,
      outputSchema: undefined,
      procedureHandlerChain: this.$internals.handlerChain,
      onErrorFns: this.$internals.onErrorFns,
      onStartFns: this.$internals.onStartFns,
      staticMergedInputSchema: this.$internals.staticMergedInputSchema,
      onSuccessFns: this.$internals.onSuccessFns,
      onCompleteFns: this.$internals.onCompleteFns,
      timeout: this.$internals.timeout,
      retryConfig: this.$internals.retryConfig,
      shapeErrorFns: this.$internals.shapeErrorFns,
    }) as any
  }
}

/** a helper type to hold any complete procedure */
export interface TAnyCompleteProcedure
  extends CompleteProcedure<any, any, any> {}

type InferTError<T extends TAnyCompleteProcedure> =
  T extends CompleteProcedure<any, any, infer TError> ? TError : never

type InferInputSchema<T extends TAnyCompleteProcedure> =
  T extends CompleteProcedure<infer TInputSchema, any, any>
    ? TInputSchema
    : never

/** The return type of `createServerActionProcedure` given a parent procedure */
type TRet<T extends TAnyCompleteProcedure | undefined> =
  T extends TAnyCompleteProcedure
    ? TZodSafeFunction<
        InferInputSchema<T>,
        undefined,
        InferTError<T>,
        TZodSafeFunctionDefaultOmitted,
        inferServerActionReturnData<T["$internals"]["lastHandler"]>,
        true,
        "json"
      >
    : TZodSafeFunction<
        undefined,
        undefined,
        TShapeErrorNotSet,
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
  T1 extends CompleteProcedure<
    any,
    TAnyZodSafeFunctionHandler<any, TContext>,
    any
  >,
>(
  first: T1,
  second: T2
): CompleteProcedure<
  TZodMerge<InferInputSchema<T1>, InferInputSchema<T2>>,
  T2["$internals"]["lastHandler"],
  InferTError<T2>
> => {
  return new CompleteProcedure({
    inputSchema: second.$internals.inputSchema,
    handlerChain: [
      ...first.$internals.handlerChain,
      second.$internals.lastHandler,
    ],
    lastHandler: second.$internals.lastHandler,
    timeout: second.$internals.timeout || first.$internals.timeout,
    retryConfig: second.$internals.retryConfig || first.$internals.retryConfig,
    staticMergedInputSchema:
      second.$internals.staticMergedInputSchema ||
      first.$internals.staticMergedInputSchema,
    shapeErrorFns: mergeArraysAndRemoveDuplicates(
      first.$internals.shapeErrorFns,
      second.$internals.shapeErrorFns
    ),
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
