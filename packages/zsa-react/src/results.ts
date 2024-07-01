import {
  TAnyZodSafeFunctionHandler,
  inferServerActionError,
  inferServerActionReturnData,
} from "zsa"

/**
 * A result object for the hook
 */
export type TInnerResult<TServerAction extends TAnyZodSafeFunctionHandler> = {
  status: "success" | "error" | "idle"
  error: undefined | inferServerActionError<TServerAction>
  data: undefined | inferServerActionReturnData<TServerAction>
}

export type TOldResult<TServerAction extends TAnyZodSafeFunctionHandler> =
  | {
      status: "empty"
      result: undefined
    }
  | {
      status: "filled"
      result: TInnerResult<TServerAction>
    }

/**
 * A result object for the hook
 */
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
    }
  | {
      // error state
      isPending: false
      isOptimistic: false
      data: undefined
      isError: true
      error: inferServerActionError<TServerAction>
      isSuccess: false
      status: "error"
    }
  | {
      isPending: false
      isOptimistic: false
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
    }

/**
 * Get the final result of the hook based on the current state
 */
export const calculateResultFromState = <
  TServerAction extends TAnyZodSafeFunctionHandler,
>(state: {
  isPending: boolean
  oldResult: TOldResult<TServerAction>
  result: TInnerResult<TServerAction>
  persistedData?: boolean
  persistedError?: boolean
}): TServerActionResult<TServerAction> => {
  const { isPending, oldResult, result, persistedData, persistedError } = state

  if (isPending && oldResult.status === "empty") {
    return {
      isPending: true,
      isOptimistic: false,
      data: persistedData ? result.data : undefined,
      isError: false,
      error: persistedError ? result.error : undefined,
      isSuccess: false,
      status: "pending",
    }
  } else if (
    isPending &&
    oldResult.status === "filled" &&
    result.status === "success"
  ) {
    return {
      isPending: true,
      isOptimistic: true,
      data: result.data as any,
      isError: false,
      error: undefined,
      isSuccess: false,
      status: "pending",
    }
  } else if (result.status === "success") {
    // success state
    return {
      isPending: false,
      isOptimistic: false,
      data: result.data as any,
      isError: false,
      error: undefined,
      isSuccess: true,
      status: "success",
    }
  } else if (result.status === "error") {
    // error state
    return {
      isPending: false,
      data: persistedData ? result.data : undefined,
      isError: true,
      error: result.error as any,
      isOptimistic: false,
      isSuccess: false,
      status: "error",
    }
  } else {
    // idle state
    return {
      isPending: false,
      data: undefined,
      isOptimistic: false,
      isError: false,
      error: undefined,
      isSuccess: false,
      status: "idle",
    }
  }
}

export const getEmptyResult = <
  TServerAction extends TAnyZodSafeFunctionHandler,
>(
  initialData?: inferServerActionReturnData<TServerAction>
): TInnerResult<TServerAction> =>
  initialData === undefined
    ? // if there is no initial data
      {
        status: "idle",
        error: undefined,
        data: undefined,
      }
    : {
        // if there is initial data
        status: "success",
        error: undefined,
        data: initialData,
      }

export const getEmptyOldResult = () =>
  ({
    status: "empty",
    result: undefined,
  }) as const
