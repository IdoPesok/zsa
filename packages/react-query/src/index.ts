"use client"

import {
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  GetNextPageParamFunction,
  InfiniteData,
  QueryKey,
} from "@tanstack/react-query"
import {
  SAWError,
  TAnyZodSafeFunctionHandler,
  inferServerActionInput,
  inferServerActionReturnData,
  inferServerActionReturnType,
} from "@za/server"

export const setupServerActionHooks = (args: {
  useQuery: typeof import("@tanstack/react-query").useQuery
  useMutation: typeof import("@tanstack/react-query").useMutation
  useInfiniteQuery: typeof import("@tanstack/react-query").useInfiniteQuery
}) => {
  const { useQuery, useMutation, useInfiniteQuery } = args

  const useServerActionInfiniteQuery = <
    TPageParam extends unknown,
    THandler extends TAnyZodSafeFunctionHandler,
  >(
    action: THandler,
    options: Omit<
      Parameters<
        typeof useInfiniteQuery<
          inferServerActionReturnData<THandler>,
          SAWError,
          InfiniteData<inferServerActionReturnData<THandler>>,
          QueryKey,
          TPageParam
        >
      >[0],
      "getNextPageParam"
    > & {
      input: (args: {
        pageParam: TPageParam
      }) => inferServerActionInput<THandler>
      getNextPageParam: GetNextPageParamFunction<
        TPageParam,
        inferServerActionReturnData<THandler>
      >
    },
    queryClient?: Parameters<typeof useInfiniteQuery>[1]
  ): DefinedUseInfiniteQueryResult<
    inferServerActionReturnData<THandler>,
    SAWError
  > => {
    return useInfiniteQuery(
      {
        ...options,
        queryFn: async ({ pageParam }) => {
          const input = options.input({ pageParam: pageParam as TPageParam })
          const [data, err] = await action(input)

          if (err) {
            throw err
          }

          return data
        },
      },
      queryClient
    ) as any
  }

  const useServerActionQuery = <THandler extends TAnyZodSafeFunctionHandler>(
    action: THandler,
    options: Omit<
      Parameters<
        typeof useQuery<inferServerActionReturnData<THandler>, SAWError>
      >[0],
      "queryFn"
    > & {
      input: inferServerActionInput<THandler>
    },
    queryClient?: Parameters<typeof useQuery>[1]
  ): DefinedUseQueryResult<inferServerActionReturnData<THandler>, SAWError> => {
    return useQuery(
      {
        ...options,
        queryFn: async () => {
          const [data, err] = await action(options.input)

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

  const useServerActionMutation = <
    THandler extends TAnyZodSafeFunctionHandler,
    TReturnError extends boolean = false,
  >(
    action: THandler,
    options?: Omit<
      Parameters<TUseMutation<THandler, TReturnError>>[0],
      "mutationFn"
    > & {
      returnError?: TReturnError
    },
    queryClient?: Parameters<typeof useMutation>[1]
  ): ReturnType<TUseMutation<THandler, TReturnError>> => {
    return useMutation(
      {
        ...options,
        mutationFn: async (...args) => {
          const [data, err] = await action(...args)

          if (options?.returnError) {
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
    useServerActionInfiniteQuery,
    useServerActionQuery,
    useServerActionMutation,
  }
}
