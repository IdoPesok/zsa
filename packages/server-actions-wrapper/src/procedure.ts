import z from "zod"
import {
  CompleteProcedure,
  TAnyCompleteProcedure,
  TDataOrError,
  TZodSafeFunction,
  TZodSafeFunctionDefaultOmitted,
  createZodSafeFunction,
  inferServerActionReturnData,
} from "./safe-zod-function"

type TOmitted<TInputSchema extends z.ZodType> =
  TInputSchema extends z.ZodUndefined
    ? TZodSafeFunctionDefaultOmitted
    : Exclude<TZodSafeFunctionDefaultOmitted, "handler"> | "noInputHandler"

type TRet<T extends TAnyCompleteProcedure | undefined> =
  T extends TAnyCompleteProcedure
    ? TZodSafeFunction<
        T["$internals"]["inputSchema"],
        z.ZodUndefined,
        TOmitted<T["$internals"]["inputSchema"]>,
        inferServerActionReturnData<T["$internals"]["lastHandler"]>,
        true
      >
    : TZodSafeFunction<
        z.ZodUndefined,
        z.ZodUndefined,
        TZodSafeFunctionDefaultOmitted,
        undefined,
        true
      >

export const createServerActionProcedure = <
  T extends TAnyCompleteProcedure | undefined = undefined,
>(
  parent?: T
): TRet<T> => {
  return createZodSafeFunction(true, parent) as any
}

export const chainServerActionProcedures = <
  T2 extends TAnyCompleteProcedure,
  TContext extends NonNullable<Parameters<T2["$internals"]["lastHandler"]>[1]>,
  T1 extends CompleteProcedure<
    any,
    (input: any, ctx: any) => TDataOrError<TContext>
  >,
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
    ctx?: any,
    $overrideInputSchema?: z.ZodType
  ) =>
    await second.$internals.lastHandler(
      input,
      ctx,
      // now we need to override the input schema
      $overrideInputSchema || inputSchema
    )

  return new CompleteProcedure({
    inputSchema,
    handlerChain: [...first.$internals.handlerChain, newLastHandler],
    lastHandler: newLastHandler,
    timeout: second.$internals.timeout || first.$internals.timeout,
    onErrorFn: second.$internals.onErrorFn || first.$internals.onErrorFn,
    onStartFn: second.$internals.onStartFn || first.$internals.onStartFn,
    onSuccessFn: second.$internals.onSuccessFn || first.$internals.onSuccessFn,
    onCompleteFn:
      second.$internals.onCompleteFn || first.$internals.onCompleteFn,
  })
}
