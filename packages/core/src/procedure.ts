import {
  TAnyZodSafeFunctionHandler,
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
      inferServerActionReturnData<T>,
      inferServerActionReturnData<T>,
      undefined,
      | Exclude<TZodSafeFunctionDefaultOmitted, "handler">
      | "noInputHandler"
      | "input",
      never
    >
  : ReturnType<typeof createZodSafeFunction> => {
  return createZodSafeFunction(parent !== undefined) as any
}
