import z from "zod"
import {
  TAnyCompleteProcedure,
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
