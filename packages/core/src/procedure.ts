import {
  TAnyObject,
  TAnyZodSafeFunctionHandler,
  TGetInputFromHandlerFunc,
  TGetParsedInputFromHandlerFunc,
  TZodSafeFunction,
  TZodSafeFunctionDefaultOmitted,
  createZodSafeFunction,
  inferServerActionReturnData,
} from "./safe-zod-function"

export const createServerActionProcedure = <
  T extends TAnyZodSafeFunctionHandler | undefined = undefined,
>(
  parent?: T
): T extends TAnyZodSafeFunctionHandler
  ? TZodSafeFunction<
      TGetInputFromHandlerFunc<T>,
      TGetParsedInputFromHandlerFunc<T>,
      undefined,
      TGetParsedInputFromHandlerFunc<T> extends TAnyObject
        ? Exclude<TZodSafeFunctionDefaultOmitted, "handler"> | "noInputHandler"
        : TZodSafeFunctionDefaultOmitted,
      inferServerActionReturnData<T>,
      true
    >
  : ReturnType<typeof createZodSafeFunction> => {
  return createZodSafeFunction(parent !== undefined) as any
}
