import { TAnyZodSafeFunctionHandler, inferServerActionReturnData } from "zsa"

export type TServerActionResult<
  TServerAction extends TAnyZodSafeFunctionHandler,
> =
  | {
      // pending state (not optimistic)
      isPending: true
      isOptimistic: false
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "pending"
      isTransitionPending: boolean
    }
  | {
      // pending state (optimistic)
      isPending: true
      isOptimistic: true
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: false
      status: "pending"
      isTransitionPending: boolean
    }
  | {
      // idle state
      isPending: false
      isOptimistic: false
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "idle"
      isTransitionPending: boolean
    }
  | {
      // error state
      isPending: false
      isOptimistic: false
      data: undefined
      isError: true
      error: unknown
      isSuccess: false
      status: "error"
      isTransitionPending: boolean
    }
  | {
      isPending: false
      isOptimistic: false
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
      isTransitionPending: boolean
    }
