import {
  TAnyZodSafeFunctionHandler,
  TZSAError,
  inferInputSchemaFromHandler,
  inferServerActionReturnData,
} from "zsa"

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
      isTransitioning: boolean
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
      isTransitioning: boolean
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
      isTransitioning: boolean
    }
  | {
      // error state
      isPending: false
      isOptimistic: false
      data: undefined
      isError: true
      error: TZSAError<inferInputSchemaFromHandler<TServerAction>>
      isSuccess: false
      status: "error"
      isTransitioning: boolean
    }
  | {
      isPending: false
      isOptimistic: false
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
      isTransitioning: boolean
    }
