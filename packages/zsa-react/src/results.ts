import {
  TAnyZodSafeFunctionHandler,
  inferServerActionError,
  inferServerActionInputRaw,
  inferServerActionReturnData,
} from "zsa"

/**
 * A result object for the hook
 */
export type TInnerResult<TServerAction extends TAnyZodSafeFunctionHandler> =
  | {
      status: "success"
      error: undefined
      data: inferServerActionReturnData<TServerAction>
      input: inferServerActionInputRaw<TServerAction>
    }
  | {
      status: "error"
      error: inferServerActionError<TServerAction>
      data: undefined
      input: inferServerActionInputRaw<TServerAction>
    }
  | {
      status: "idle"
      error: undefined
      data: undefined
      input: undefined
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
  TPersistError extends boolean = false,
  TPersistData extends boolean = false,
> =
  | {
      // pending state (not optimistic)
      isPending: true
      isOptimistic: false
      data: TPersistData extends true
        ? inferServerActionReturnData<TServerAction> | undefined
        : undefined
      isError: false
      error: TPersistError extends true
        ? inferServerActionError<TServerAction> | undefined
        : undefined
      isSuccess: false
      status: "pending"
      input: undefined
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
      input: undefined
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
      input: undefined
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
      input: inferServerActionInputRaw<TServerAction>
    }
  | {
      isPending: false
      isOptimistic: false
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
      input: inferServerActionInputRaw<TServerAction>
    }

/**
 * Get the final result of the hook based on the current state
 */
export const calculateResultFromState = <
  TServerAction extends TAnyZodSafeFunctionHandler,
  TPersistData extends boolean = false,
  TPersistError extends boolean = false,
>(state: {
  isPending: boolean
  oldResult: TOldResult<TServerAction>
  result: TInnerResult<TServerAction>
  persistDataWhilePending?: TPersistData
  persistErrorWhilePending?: TPersistError
}): TServerActionResult<TServerAction, TPersistData, TPersistError> => {
  const { isPending, oldResult, result } = state

  if (isPending && oldResult.status === "empty") {
    return {
      isPending: true,
      isOptimistic: false,
      data: state.persistDataWhilePending ? result.data : undefined,
      isError: false,
      error: state.persistErrorWhilePending ? result.error : undefined,
      isSuccess: false,
      status: "pending",
      input: undefined,
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
      input: undefined,
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
      input: result.input,
    }
  } else if (result.status === "error") {
    // error state
    return {
      isPending: false,
      data: undefined,
      isError: true,
      error: result.error as any,
      isOptimistic: false,
      isSuccess: false,
      status: "error",
      input: result.input,
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
      input: undefined,
    }
  }
}

export const getEmptyResult = <
  TServerAction extends TAnyZodSafeFunctionHandler,
>(
  initialData?: inferServerActionReturnData<TServerAction>,
  initialInput?: inferServerActionInputRaw<TServerAction>
): TInnerResult<TServerAction> =>
  initialData === undefined
    ? // if there is no initial data
      {
        status: "idle",
        error: undefined,
        data: undefined,
        input: undefined,
      }
    : {
        // if there is initial data
        status: "success",
        error: undefined,
        data: initialData,
        input: initialInput as any,
      }

export const getEmptyOldResult = () =>
  ({
    status: "empty",
    result: undefined,
  }) as const
