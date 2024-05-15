import { useMutation, useQuery } from "@tanstack/react-query"
import {
  SAWError,
  TAnyZodSafeFunctionHandler,
  inferServerActionInput,
  inferServerActionReturnData,
  inferServerActionReturnType,
  inferServerActionReturnTypeHot,
} from "server-actions-wrapper"

export const useQueryCustom = <THandler extends TAnyZodSafeFunctionHandler>(
  a: Omit<Parameters<typeof useQuery>[0], "queryFn"> & {
    queryFn: () => inferServerActionReturnTypeHot<THandler>
  },
  b?: Parameters<typeof useQuery>[1]
): ReturnType<
  typeof useQuery<inferServerActionReturnData<THandler>, SAWError>
> => {
  return useQuery(
    {
      ...a,
      queryFn: async () => {
        const [data, err] = await a.queryFn()

        if (err) {
          throw err
        }

        return data
      },
    },
    b
  ) as any
}

export const useMutationCustom = <
  THandler extends TAnyZodSafeFunctionHandler,
  TNeverThrow extends boolean = false,
>(
  a: Omit<Parameters<typeof useMutation>[0], "mutationFn"> & {
    mutationFn: THandler
    neverThrow?: TNeverThrow
  },
  b?: Parameters<typeof useMutation>[1]
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
      ...a,
      mutationFn: async (...args) => {
        const [data, err] = await a.mutationFn(...args)

        if (a.neverThrow) {
          return [data, err]
        }

        if (err) {
          throw err
        }

        return data
      },
    },
    b
  ) as any
}
