import { TAnyZodSafeFunctionHandler, inferServerActionReturnData } from "zsa"
import { TInnerResult, TOldResult } from "./results"

export type TSetOptimisticInput<
  TServerAction extends TAnyZodSafeFunctionHandler,
> =
  | ((
      current: TInnerResult<TServerAction>["data"]
    ) => inferServerActionReturnData<TServerAction>)
  | inferServerActionReturnData<TServerAction>

export const evaluateOptimisticInput = <
  TServerAction extends TAnyZodSafeFunctionHandler,
>(
  fn: TSetOptimisticInput<TServerAction>,
  oldResult: TOldResult<TServerAction>,
  result: TInnerResult<TServerAction>
) => {
  function isFunction(value: any): value is Function {
    return typeof value === "function"
  }
  return isFunction(fn)
    ? fn(oldResult.status === "empty" ? result.data : oldResult.result.data)
    : fn
}
