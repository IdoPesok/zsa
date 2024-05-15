import {
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  GetNextPageParamFunction,
  InfiniteData,
  QueryKey,
} from "@tanstack/react-query"
import { SAWError } from "./errors"
import {
  TAnyZodSafeFunctionHandler,
  inferServerActionInput,
  inferServerActionReturnData,
  inferServerActionReturnType,
  inferServerActionReturnTypeHot,
} from "./zod-safe-function"

type TData<
  TReturn extends inferServerActionReturnTypeHot<TAnyZodSafeFunctionHandler>,
> = NonNullable<Awaited<TReturn>[0]>

export const setupReactQueryHooksWithServerActions = (
  useQuery: typeof import("@tanstack/react-query").useQuery,
  useMutation: typeof import("@tanstack/react-query").useMutation,
  useInfiniteQuery: typeof import("@tanstack/react-query").useInfiniteQuery
) => {
  const useInfiniteQueryOverride = <
    TPageParam extends unknown,
    TReturn extends inferServerActionReturnTypeHot<TAnyZodSafeFunctionHandler>,
  >(
    options: Omit<
      Parameters<
        typeof useInfiniteQuery<
          TData<TReturn>,
          SAWError,
          InfiniteData<TData<TReturn>>,
          QueryKey,
          TPageParam
        >
      >[0],
      "queryFn" | "getNextPageParam"
    > & {
      queryFn: (args: { pageParam: TPageParam }) => TReturn
      getNextPageParam: GetNextPageParamFunction<TPageParam, TData<TReturn>>
    },
    queryClient?: Parameters<typeof useInfiniteQuery>[1]
  ): DefinedUseInfiniteQueryResult<TData<TReturn>, SAWError> => {
    return useInfiniteQuery(
      {
        ...options,
        queryFn: async ({ pageParam }) => {
          const [data, err] = await options.queryFn({
            pageParam: pageParam as TPageParam,
          })

          if (err) {
            throw err
          }

          return data
        },
      },
      queryClient
    ) as any
  }

  const useQueryOverride = <
    TReturn extends inferServerActionReturnTypeHot<TAnyZodSafeFunctionHandler>,
  >(
    options: Omit<
      Parameters<typeof useQuery<TData<TReturn>, SAWError>>[0],
      "queryFn"
    > & {
      queryFn: () => TReturn
    },
    queryClient?: Parameters<typeof useQuery>[1]
  ): DefinedUseQueryResult<TData<TReturn>, SAWError> => {
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

  type TUseMutation<
    THandler extends TAnyZodSafeFunctionHandler,
    TNeverThrow extends boolean = false,
  > = typeof useMutation<
    TNeverThrow extends false
      ? inferServerActionReturnData<THandler>
      : inferServerActionReturnType<THandler>,
    SAWError,
    inferServerActionInput<THandler>
  >

  const useMutationOverride = <
    THandler extends TAnyZodSafeFunctionHandler,
    TNeverThrow extends boolean = false,
  >(
    options: Omit<
      Parameters<TUseMutation<THandler, TNeverThrow>>[0],
      "mutationFn"
    > & {
      mutationFn: THandler
      neverThrow?: TNeverThrow
    },
    queryClient?: Parameters<typeof useMutation>[1]
  ): ReturnType<TUseMutation<THandler, TNeverThrow>> => {
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
    useInfiniteQuery: useInfiniteQueryOverride,
  }
}
