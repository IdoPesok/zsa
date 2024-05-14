import {
  TAnyZodSafeFunctionHandler,
  inferServerActionReturnData,
} from "./safe-zod-function"

export type TServerActionResult<
  TServerAction extends TAnyZodSafeFunctionHandler,
> =
  // loading state (no optimistic)
  | {
      /** The action is executing for the first time */
      isLoading: true
      /** The action already has data and is now refetching */
      isRefetching: false
      /** A request is in-flight and has not yet returned data */
      isExecuting: true
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: false
      /** The action data fetched */
      data: undefined
      /** The action is in an error state */
      isError: false
      /** The action error */
      error: undefined
      /** The action successfully fetched data */
      isSuccess: false
      /** The action status */
      status: "loading"
    }
  // refreshing state (no optimistic)
  | {
      /** The action is executing for the first time */
      isLoading: false
      /** The action already has data and is now refetching */
      isRefetching: true
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: false
      /** A request is in-flight and has not yet returned data */
      isExecuting: true
      /** The action data fetched */
      data: inferServerActionReturnData<TServerAction>
      /** The action is in an error state */
      isError: false
      /** The action error */
      error: undefined
      /** The action successfully fetched data */
      isSuccess: true
      /** The action status */
      status: "refetching"
    }
  // loading state (optimistic)
  | {
      /** The action is executing for the first time */
      isLoading: true
      /** The action already has data and is now refetching */
      isRefetching: false
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: true
      /** A request is in-flight and has not yet returned data */
      isExecuting: true
      /** The action data fetched */
      data: inferServerActionReturnData<TServerAction>
      /** The action is in an error state */
      isError: false
      /** The action error */
      error: undefined
      /** The action successfully fetched data */
      isSuccess: false
      /** The action status */
      status: "loading"
    }
  // refetching state (optimistic)
  | {
      /** The action is executing for the first time */
      isLoading: false
      /** The action already has data and is now refetching */
      isRefetching: true
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: true
      /** A request is in-flight and has not yet returned data */
      isExecuting: true
      /** The action data fetched */
      data: inferServerActionReturnData<TServerAction>
      /** The action is in an error state */
      isError: false
      /** The action error */
      error: undefined
      /** The action successfully fetched data */
      isSuccess: true
      /** The action status */
      status: "refetching"
    }
  // idle state
  | {
      /** The action is executing for the first time */
      isLoading: false
      /** The action already has data and is now refetching */
      isRefetching: false
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: false
      /** A request is in-flight and has not yet returned data */
      isExecuting: false
      /** The action data fetched */
      data: undefined
      /** The action is in an error state */
      isError: false
      /** The action error */
      error: undefined
      /** The action successfully fetched data */
      isSuccess: false
      /** The action status */
      status: "idle"
    }
  // error state
  | {
      /** The action is executing for the first time */
      isLoading: false
      /** The action already has data and is now refetching */
      isRefetching: false
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: false
      /** A request is in-flight and has not yet returned data */
      isExecuting: false
      /** The action data fetched */
      data: undefined
      /** The action is in an error state */
      isError: true
      /** The action error */
      error: unknown
      /** The action successfully fetched data */
      isSuccess: false
      /** The action status */
      status: "error"
    }
  // success state
  | {
      /** The action is executing for the first time */
      isLoading: false
      /** The action already has data and is now refetching */
      isRefetching: false
      /** The current `data` being shown is from `setOptimistic` */
      isOptimistic: false
      /** A request is in-flight and has not yet returned data */
      isExecuting: false
      /** The action data fetched */
      data: inferServerActionReturnData<TServerAction>
      /** The action is in an error state */
      isError: false
      /** The action error */
      error: undefined
      /** The action successfully fetched data */
      isSuccess: true
      /** The action status */
      status: "success"
    }
