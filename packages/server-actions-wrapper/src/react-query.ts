import { DefinedUseQueryResult } from "@tanstack/react-query"
import { SAWError } from "./errors"
import {
  TAnyZodSafeFunctionHandler,
  inferServerActionInput,
  inferServerActionReturnData,
  inferServerActionReturnType,
  inferServerActionReturnTypeHot,
} from "./zod-safe-function"

export const setupReactQueryHooksWithServerActions = (
  useQuery: typeof import("@tanstack/react-query").useQuery,
  useMutation: typeof import("@tanstack/react-query").useMutation
) => {
  const useQueryOverride = <
    TReturn extends inferServerActionReturnTypeHot<TAnyZodSafeFunctionHandler>,
  >(
    options: Omit<Parameters<typeof useQuery>[0], "queryFn"> & {
      queryFn: () => TReturn
    },
    queryClient?: Parameters<typeof useQuery>[1]
  ): DefinedUseQueryResult<NonNullable<Awaited<TReturn>[0]>, SAWError> => {
    return useQuery(
      {
        ...options,
        queryFn: async () => {
          const [data, err] = await options.queryFn()

          if (err) {
            throw err
          }

          return data
        },
      },
      queryClient
    ) as any
  }

  const useMutationOverride = <
    THandler extends TAnyZodSafeFunctionHandler,
    TNeverThrow extends boolean = false,
  >(
    options: Omit<Parameters<typeof useMutation>[0], "mutationFn"> & {
      mutationFn: THandler
      neverThrow?: TNeverThrow
    },
    queryClient?: Parameters<typeof useMutation>[1]
  ): ReturnType<
    typeof useMutation<
      TNeverThrow extends false
        ? inferServerActionReturnData<THandler>
        : inferServerActionReturnType<THandler>,
      SAWError,
      inferServerActionInput<THandler>
    >
  > => {
    return useMutation(
      {
        ...options,
        mutationFn: async (...args) => {
          const [data, err] = await options.mutationFn(...args)

          if (options.neverThrow) {
            return [data, err]
          }

          if (err) {
            throw err
          }

          return data
        },
      },
      queryClient
    ) as any
  }

  return {
    useQuery: useQueryOverride,
    useMutation: useMutationOverride,
  }
}
