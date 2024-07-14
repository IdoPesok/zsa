"use client"

import {
  DefinedUseQueryResult,
  GetNextPageParamFunction,
  InfiniteData,
  UseQueryResult,
} from "@tanstack/react-query"
import {
  TAnyZodSafeFunctionHandler,
  inferServerActionError,
  inferServerActionInput,
  inferServerActionReturnData,
  inferServerActionReturnType,
} from "zsa"

type ServerActionsKeyFactory<TKey extends string[]> = {
  [key: string]: (...args: any[]) => TKey
}

type ServerActionKeys<TFactory extends ServerActionsKeyFactory<string[]>> =
  ReturnType<TFactory[keyof TFactory]>

export const createServerActionsKeyFactory = <
  const TKeys extends string[],
  const TFactory extends ServerActionsKeyFactory<TKeys>,
>(
  factory: TFactory
) => {
  return factory
}

export const setupServerActionHooks = <
  const TQueryFactory extends
    | Readonly<ServerActionsKeyFactory<string[]>>
    | undefined,
  const TMutationFactory extends
    | Readonly<ServerActionsKeyFactory<string[]>>
    | undefined,
>(args: {
  hooks: {
    useQuery: typeof import("@tanstack/react-query").useQuery
    useMutation: typeof import("@tanstack/react-query").useMutation
    useInfiniteQuery: typeof import("@tanstack/react-query").useInfiniteQuery
  }
  queryKeyFactory?: TQueryFactory
  mutationKeyFactory?: TMutationFactory
}) => {
  const { useQuery, useMutation, useInfiniteQuery } = args.hooks

  type TQueryKey = TQueryFactory extends undefined
    ? Readonly<unknown[]>
    : Readonly<ServerActionKeys<Exclude<TQueryFactory, undefined>>>

  type TMutationKey = TMutationFactory extends undefined
    ? Readonly<unknown[]>
    : Readonly<ServerActionKeys<Exclude<TMutationFactory, undefined>>>

  const useServerActionInfiniteQuery = <
    TPageParam extends unknown,
    THandler extends TAnyZodSafeFunctionHandler,
    TInitialData extends
      | undefined
      | inferServerActionReturnData<THandler>
      | (() => inferServerActionReturnData<THandler>),
  >(
    action: THandler,
    options: Omit<
      Parameters<
        typeof useInfiniteQuery<
          inferServerActionReturnData<THandler>,
          inferServerActionError<THandler>,
          InfiniteData<inferServerActionReturnData<THandler>>,
          TQueryKey,
          TPageParam
        >
      >[0],
      "getNextPageParam" | "initialData"
    > & {
      input: (args: {
        pageParam: TPageParam
      }) => inferServerActionInput<THandler>
      getNextPageParam: GetNextPageParamFunction<
        TPageParam,
        inferServerActionReturnData<THandler>
      >
      initialData?: TInitialData
    },
    queryClient?: Parameters<typeof useInfiniteQuery>[1]
  ): ReturnType<
    typeof useInfiniteQuery<
      inferServerActionReturnData<THandler>,
      inferServerActionError<THandler>,
      InfiniteData<inferServerActionReturnData<THandler>>,
      TQueryKey,
      TPageParam
    >
  > => {
    return useInfiniteQuery(
      {
        ...options,
        queryFn: async ({ pageParam }) => {
          const input = options.input({ pageParam: pageParam as TPageParam })
          const result = await action(input)

          if (!result) return

          const [data, err] = result

          if (err) {
            throw err
          }

          return data
        },
      },
      queryClient
    ) as any
  }

  const useServerActionQuery = <
    THandler extends TAnyZodSafeFunctionHandler,
    TInitialData extends
      | undefined
      | inferServerActionReturnData<THandler>
      | (() => inferServerActionReturnData<THandler>),
  >(
    action: THandler,
    options: Omit<
      Parameters<
        typeof useQuery<
          inferServerActionReturnData<THandler>,
          inferServerActionError<THandler>,
          inferServerActionReturnData<THandler>,
          TQueryKey
        >
      >[0],
      "queryFn" | "initialData"
    > & {
      input: inferServerActionInput<THandler>
      initialData?: TInitialData
    },
    queryClient?: Parameters<typeof useQuery>[1]
  ): TInitialData extends undefined
    ? UseQueryResult<
        inferServerActionReturnData<THandler>,
        inferServerActionError<THandler>
      >
    : DefinedUseQueryResult<
        inferServerActionReturnData<THandler>,
        inferServerActionError<THandler>
      > => {
    return useQuery(
      {
        ...options,
        queryFn: async () => {
          const result = await action(options.input)

          if (!result) return

          const [data, err] = result

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
    inferServerActionError<THandler>,
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
      mutationKey?: TMutationKey
    },
    queryClient?: Parameters<typeof useMutation>[1]
  ): ReturnType<TUseMutation<THandler, TReturnError>> => {
    return useMutation(
      {
        ...options,
        mutationFn: async (...args) => {
          const result = await action(...args)

          // redirect or not found
          if (!result) return

          const [data, err] = result

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
