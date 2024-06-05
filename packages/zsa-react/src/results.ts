import {
  TAnyZodSafeFunctionHandler,
  TZSAError,
  inferInputSchemaFromHandler,
  inferServerActionError,
  inferServerActionReturnData,
} from "zsa"

/**
 * A result object for the hook
 */
export type TInnerResult<TServerAction extends TAnyZodSafeFunctionHandler> = {
  isError: boolean
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
      error: TZSAError<inferInputSchemaFromHandler<TServerAction>>
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
}) => {
  const { isPending, oldResult, result } = state

  if (isPending && oldResult.status === "empty") {
    return {
      isPending: true,
      isOptimistic: false,
      data: undefined,
      isError: false,
      error: undefined,
      isSuccess: false,
      status: "pending",
    }
  } else if (isPending && oldResult.status === "filled" && result.data) {
    return {
      isPending: true,
      isOptimistic: true,
      data: result.data,
      isError: false,
      error: undefined,
      isSuccess: false,
      status: "pending",
    }
  } else if (!result.isError && result.data) {
    // success state
    return {
      isPending: false,
      isOptimistic: false,
      data: result.data,
      isError: false,
      error: undefined,
      isSuccess: true,
      status: "success",
    }
  } else if (result.isError) {
    // error state
    return {
      isPending: false,
      data: undefined,
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
        isError: false,
        error: undefined,
        data: undefined,
      }
    : {
        // if there is initial data
        isError: false,
        error: undefined,
        data: initialData,
      }

export const getEmptyOldResult = () =>
  ({
    status: "empty",
    result: undefined,
  }) as const
