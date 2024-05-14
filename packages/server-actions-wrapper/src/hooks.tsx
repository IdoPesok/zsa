"use client"

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import {
  ServerActionKeys,
  ServerActionsKeyFactory,
  createServerActionsKeyFactory,
} from "./action-key-factory"
import { SAWError } from "./errors"
import { clone, deepEqual } from "./helpers"
import {
  ServerActionUtilsContext,
  ServerActionUtilsProvider,
  TServerActionUtilsContext,
  getActionKeyFromArr,
} from "./provider"
import { TServerActionResult } from "./result-states"
import {
  TAnyZodSafeFunctionHandler,
  inferServerActionReturnData,
} from "./safe-zod-function"

/**
 * Setup the server action hooks `useServerActionUtils` and `useServerAction`
 *
 * @param factory Optionally pass a factory of action keys.
 * to make your action keys strongly typed. To create a factory, use
 * {@link createServerActionsKeyFactory}
 *
 * @example
 * Without type-safe action keys
 * ```ts
 * const { useServerActionUtils, useServerAction } = setupServerActionHooks()
 * ```
 *
 * @example
 * With type-safe action keys
 * ```ts
 * const actionKeyFactory = createServerActionsKeyFactory({
 *   posts: () => ["posts"],
 *   postsList: () => ["posts", "list"],
 *   postDetails: (id: string) => ["posts", "details", id],
 * })
 * const { useServerActionUtils, useServerAction } = setupServerActionHooks(actionKeyFactory)
 * ```
 */
export const setupServerActionHooks = <
  TFactory extends ServerActionsKeyFactory<string[]> = ServerActionsKeyFactory<
    string[]
  >,
>(
  factory?: TFactory
) => {
  const useServerActionUtils = () => {
    const context = useContext(ServerActionUtilsContext)
    if (context === undefined) {
      const defaultState: TServerActionUtilsContext<
        ServerActionKeys<TFactory>
      > = {
        $$refetch: undefined,
        refetch: () => {},
      }

      return defaultState
    }

    return context as TServerActionUtilsContext<ServerActionKeys<TFactory>>
  }

  const useServerAction = <
    const TServerAction extends TAnyZodSafeFunctionHandler,
  >(
    /** The server action to use */
    serverAction: TServerAction,

    /** The options for querying the server action */
    opts?: {
      /** The input argument for the server action */
      input: Parameters<TServerAction>[0]

      /**
       * Bind a server action to a specific action key, can be used to refetch the action
       * with refetch from `useServerActionUtils`
       *
       * The action key should be an array of strings that represents a path
       *
       * @example
       * ```ts
       * actionKey: ["posts", "details", "123"]
       * ```
       * This action would be able to be refetched with
       * - ["posts"]
       * - ["posts", "list"]
       * - ["posts", "details", "123"]
       *
       * It would not be able to be refetched with
       * - ["posts", "details", "345"]
       * - ["something", "posts"]
       */
      actionKey?: ServerActionKeys<TFactory>

      /** A boolean indicating whether the action can be executed */
      enabled?: boolean

      /**
       * A function to run when the action errors
       *
       * @param data an object containing the error and a function to refetch the action
       */
      onError?: (data: { err: SAWError; refetch: () => void }) => void

      /**
       * A function to run when the action is successful
       *
       * @param data the data returned from the action
       */
      onSuccess?: (data: {
        data: Awaited<ReturnType<TServerAction>>[0]
      }) => void

      /** A function to run when the action is started */
      onStart?: () => void

      /** A retry configuration for the action */
      retry?: {
        /** The maximum number of times to retry the action. Inclusive. */
        maxAttempts: number
        /**
         * The delay in milliseconds between each retry attempt.
         *
         * Can either be a number (ms) or a function that takes the
         * current attempt number and the error as arguments and returns a number of ms.
         *
         * NOTE: The current attempt starts at 2
         * (the first attempt errored then the current attempt becomes is 2)
         */
        delay?:
          | number
          | ((
              /** The current attempt number. Note this starts at 2 */
              currentAttempt: number,
              /** The error that occurred during the last attempt */
              err: SAWError
            ) => number)
      }

      /** Optional initial data for the action */
      initialData?: Awaited<ReturnType<TServerAction>>[0]

      /**
       * Refetch the action every `refetchInterval` milliseconds
       */
      refetchInterval?: number
    }
  ) => {
    type TResult = {
      isError: boolean
      error: undefined | unknown
      data: undefined | inferServerActionReturnData<TServerAction>
    }

    const enabled = opts?.enabled ?? true
    const [, startTransition] = useTransition()
    const [result, setResult] = useState<TResult>({
      isError: false,
      error: undefined,
      data: undefined,
    })
    const inputRef = useRef<Parameters<TServerAction>[0] | undefined>()
    const hasInputBeenSet = useRef(false)
    const [isExecuting, setIsExecuting] = useState(
      opts !== undefined && enabled
    )
    const { $$refetch } = useServerActionUtils()
    const [oldResult, setOldResult] = useState<
      | {
          status: "empty"
          result: undefined
        }
      | {
          status: "filled"
          result: TResult
        }
    >({
      status: "empty",
      result: undefined,
    })
    const lastRefetchId = useRef<number | undefined>(undefined)
    const lastRetryId = useRef<number | undefined>(undefined)
    const retryCount = useRef(0)

    const internalExecute = useCallback(
      async (
        input: Parameters<TServerAction>[0],
        args?: {
          isFromTimeoutId?: number
          isFromRetryId?: number
        }
      ): Promise<Awaited<ReturnType<TServerAction>>> => {
        const { isFromTimeoutId, isFromRetryId } = args || {}

        // if the timeout ids don't match, we should not refetch
        if (isFromTimeoutId && lastRefetchId.current !== isFromTimeoutId) {
          return null as any
        }

        // if the retry ids don't match, we should not refetch
        if (isFromRetryId && lastRetryId.current !== isFromRetryId) {
          return null as any
        }

        // start a new timeout id
        const timeoutId = Math.floor(Math.random() * 10000)
        lastRefetchId.current = timeoutId

        // start a new retry count
        if (!isFromRetryId) {
          retryCount.current = 0
        }

        // start a new retry id
        const retryId = Math.floor(Math.random() * 10000)
        lastRetryId.current = retryId

        if (opts?.onStart) opts.onStart()

        setIsExecuting(true)
        inputRef.current = clone(input)
        hasInputBeenSet.current = true

        const [data, err] = await serverAction(input)

        // handle refetching
        // call with the timeout id
        const triggerRefetchIfNeeded = () => {
          if (!opts?.refetchInterval) return
          setTimeout(() => {
            internalExecute(input, {
              ...(args || {}),
              isFromTimeoutId: timeoutId,
            })
          }, opts.refetchInterval)
        }

        if (err) {
          if (opts?.onError) {
            opts.onError({
              err,
              refetch: refetch,
            })
          }

          setIsExecuting(false)

          // calculate if we should retry
          const retryConfig = opts?.retry
          const shouldRetry = retryConfig
            ? retryCount.current < retryConfig.maxAttempts
            : false

          let retryDelay = 0
          const retryDelayOpt = retryConfig?.delay
          if (retryDelayOpt && typeof retryDelayOpt === "function") {
            retryDelay = retryDelayOpt(retryCount.current + 1, err)
          } else if (retryDelayOpt && typeof retryDelayOpt === "number") {
            retryDelay = retryDelayOpt
          }

          if (shouldRetry) {
            // execute the retry logic
            retryCount.current += 1
            setTimeout(() => {
              internalExecute(input, {
                ...(args || {}),
                isFromRetryId: retryId,
              })
            }, retryDelay)
          } else {
            // don't retry => update the result
            if (oldResult.status === "filled") {
              setResult(oldResult.result)
            } else {
              setResult({ error: err, isError: true, data: undefined })
            }

            // clear the old data
            setOldResult({
              status: "empty",
              result: undefined,
            })

            triggerRefetchIfNeeded()
          }

          return [data, err] as any
        }

        if (opts?.onSuccess) {
          opts.onSuccess({
            data,
          })
        }

        setResult({
          isError: false,
          error: undefined,
          data: data ?? undefined,
        })
        setIsExecuting(false)

        // clear the old data
        setOldResult({
          status: "empty",
          result: undefined,
        })

        triggerRefetchIfNeeded()

        return [data, err] as any
      },
      [serverAction]
    )

    const execute = useCallback(
      async (input: Parameters<TServerAction>[0]) => {
        return await internalExecute(input)
      },
      [internalExecute]
    )

    const executeWithTransition = useCallback(
      async (input: Parameters<TServerAction>[0]) => {
        setIsExecuting(true)
        startTransition(() => {
          execute(input)
        })
      },
      [execute]
    )

    function isFunction(value: any): value is Function {
      return typeof value === "function"
    }

    const setOptimistic = useCallback(
      async (
        fn:
          | ((
              current: typeof result.data
            ) => NonNullable<Awaited<ReturnType<TServerAction>>[0]>)
          | NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      ) => {
        const data = isFunction(fn)
          ? fn(
              oldResult.status === "empty" ? result.data : oldResult.result.data
            )
          : fn

        if (oldResult.status === "empty") {
          setOldResult({
            status: "filled",
            result: { ...result },
          })
        }

        setResult({
          isError: false,
          error: undefined,
          data: data ?? undefined,
        })
      },
      [execute]
    )

    useEffect(() => {
      if (opts === undefined || opts.enabled === false) return

      if (deepEqual(opts.input, inputRef.current)) {
        return
      }

      inputRef.current = clone(opts.input)
      hasInputBeenSet.current = true

      executeWithTransition(opts.input)
    }, [executeWithTransition, opts?.input, opts?.enabled])

    useEffect(() => {
      if (
        !opts?.actionKey ||
        !hasInputBeenSet.current ||
        !enabled ||
        !$$refetch
      )
        return

      if (
        !getActionKeyFromArr(opts?.actionKey || []).startsWith($$refetch.key)
      ) {
        return
      }

      executeWithTransition(inputRef.current)
    }, [executeWithTransition, $$refetch])

    const refetch = useCallback(() => {
      if (!hasInputBeenSet.current) return // can't refetch if input hasn't been set
      executeWithTransition(inputRef.current)
    }, [hasInputBeenSet.current, executeWithTransition, inputRef.current])

    const reset = useCallback(() => {
      setResult({
        isError: false,
        error: undefined,
        data: undefined,
      })
    }, [])

    let final: TServerActionResult<TServerAction>

    if (isExecuting && oldResult.status === "empty") {
      const base = {
        isOptimistic: false,
        isExecuting: true,
        isError: false,
        error: undefined,
      } as const

      // loading state (not optimistic)
      if (result.data) {
        // refetching
        final = {
          ...base,
          isLoading: false,
          isRefetching: true,
          data: result.data,
          isSuccess: true,
          status: "refetching",
        }
      } else {
        final = {
          ...base,
          isLoading: true,
          isSuccess: false,
          isRefetching: false,
          data: undefined,
          status: "loading",
        }
      }
    } else if (isExecuting && oldResult.status === "filled" && result.data) {
      const base = {
        isOptimistic: true,
        isExecuting: true,
        isError: false,
        error: undefined,
      } as const

      // loading state (optimistic)
      if (oldResult.result.data) {
        // refetching
        final = {
          ...base,
          isLoading: false,
          isRefetching: true,
          data: result.data,
          isSuccess: true,
          status: "refetching",
        }
      } else {
        // loading
        final = {
          ...base,
          isLoading: true,
          isRefetching: false,
          isSuccess: false,
          data: result.data,
          status: "loading",
        }
      }
    } else if (!result.isError && result.data) {
      // success state
      final = {
        isLoading: false,
        isRefetching: false,
        isExecuting: false,
        data: result.data,
        isError: false,
        isOptimistic: false,
        error: undefined,
        isSuccess: true,
        status: "success",
      }
    } else if (result.isError) {
      // error state
      final = {
        isLoading: false,
        isRefetching: false,
        isExecuting: false,
        data: undefined,
        isError: true,
        error: result.error,
        isOptimistic: false,
        isSuccess: false,
        status: "error",
      }
    } else {
      // idle state
      final = {
        isLoading: false,
        isExecuting: false,
        isRefetching: false,
        data: undefined,
        isOptimistic: false,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "idle",
      }
    }

    return {
      ...final,

      /** reset the server action result to the idle state */
      reset,

      /** refetch the server action with the current input */
      refetch,

      /** execute the server action */
      execute,

      /** set an optimistic state for the server action */
      setOptimistic,
    }
  }

  return {
    /**
     * `refetch` is used to refetch the action
     * @param keyArr The action key array
     */
    useServerActionUtils,

    /**
     * Manage a server action query or mutation on the client
     * @example
     * Mutation
     * ```ts
     * const { isLoading, execute } = useServerAction(myAction)
     * ```
     * @example
     * Query
     * ```ts
     * const { isLoading, data } = useServerAction(myAction, {
     *  input: { id: 123 },
     * })
     * ```
     */
    useServerAction,
  }
}

export { ServerActionUtilsProvider, createServerActionsKeyFactory }
