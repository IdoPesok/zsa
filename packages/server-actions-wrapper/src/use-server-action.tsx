"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { SAWError } from "./errors"
import {
  TAnyZodSafeFunctionHandler,
  inferServerActionReturnData,
} from "./safe-zod-function"

function clone<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return [...value.map((item) => clone(item))] as unknown as T
    } else {
      return {
        ...Object.entries(value).reduce(
          (obj, [key, val]) => ({ ...obj, [key]: clone(val) }),
          {}
        ),
      } as any
    }
  }
  return value
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false
  }

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false
    }
  }

  return true
}

export type TServerActionResult<
  TServerAction extends TAnyZodSafeFunctionHandler,
> =
  | {
      // loading state
      isLoading: true
      isLoadingOptimistic: false
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "loading"
    }
  | {
      // loading state
      isLoading: true
      isLoadingOptimistic: true
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: false
      status: "loading"
    }
  | {
      // idle state
      isLoading: false
      isLoadingOptimistic: false
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "idle"
    }
  | {
      // error state
      isLoading: false
      isLoadingOptimistic: false
      data: undefined
      isError: true
      error: unknown
      isSuccess: false
      status: "error"
    }
  | {
      isLoading: false
      isLoadingOptimistic: false
      data: inferServerActionReturnData<TServerAction>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
    }

type ServerActionsKeyFactory<TKey extends string[]> = {
  [key: string]: (...args: any[]) => TKey
}

export type ServerActionKeys<
  TFactory extends ServerActionsKeyFactory<string[]>,
> = ReturnType<TFactory[keyof TFactory]>

export const createServerActionsKeyFactory = <
  const TKeys extends string[],
  const TFactory extends ServerActionsKeyFactory<TKeys>,
>(
  factory: TFactory
) => {
  return factory
}

type TServerActionUtilsContext<T extends string[]> = {
  $$refetch:
    | undefined
    | {
        timestamp: number
        key: string
      }
  refetch: (keys: T) => void
}

const ServerActionUtilsContext = createContext<
  TServerActionUtilsContext<string[]>
>({
  $$refetch: undefined,
  refetch: () => {},
})

const ACTION_KEY_SEPARATOR = "<|break|>"
const getActionKeyFromArr = (arr: string[]) => arr.join(ACTION_KEY_SEPARATOR)

export function ServerActionUtilsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [refetchState, setRefetchState] =
    useState<TServerActionUtilsContext<any>["$$refetch"]>(undefined)

  const refetch = useCallback((keyArr: string[]) => {
    const key = getActionKeyFromArr(keyArr)

    if (key.includes(ACTION_KEY_SEPARATOR)) {
      console.error(
        `ServerActionUtilsProvider: key contains separator (${ACTION_KEY_SEPARATOR}). This will lead to invalid refetching. Please remove it.`,
        key
      )
    }

    setRefetchState({
      timestamp: Date.now(),
      key,
    })
  }, [])

  return (
    <ServerActionUtilsContext.Provider
      value={{ refetch, $$refetch: refetchState }}
    >
      {children}
    </ServerActionUtilsContext.Provider>
  )
}

export const setupServerActionHooks = <
  TFactory extends ServerActionsKeyFactory<string[]> = ServerActionsKeyFactory<
    string[]
  >,
>(
  factory?: TFactory
) => {
  const useServerActionsUtils = () => {
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
    serverAction: TServerAction,
    opts?: {
      input: Parameters<TServerAction>[0]
      actionKey?: ServerActionKeys<TFactory>
      enabled?: boolean
      onError?: (args: { err: SAWError; refetch: () => void }) => void
      onSuccess?: (args: {
        data: Awaited<ReturnType<TServerAction>>[0]
      }) => void
      onStart?: () => void
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
    const inputRef = useRef<Parameters<TServerAction>[0] | undefined>(
      opts?.input ? clone(opts.input) : undefined
    )
    const [isExecuting, setIsExecuting] = useState(
      opts !== undefined && enabled
    )
    const { $$refetch } = useServerActionsUtils()
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

    const execute = useCallback(
      async (
        input: Parameters<TServerAction>[0]
      ): Promise<Awaited<ReturnType<TServerAction>>> => {
        if (opts?.onStart) opts.onStart()

        setIsExecuting(true)
        inputRef.current = clone(input)

        const [data, err] = await serverAction(input)

        if (err) {
          if (opts?.onError) {
            opts.onError({
              err,
              refetch: refetch,
            })
          }

          if (oldResult.status === "filled") {
            setResult(oldResult.result)
          } else {
            setResult({ error: err, isError: true, data: undefined })
          }

          setIsExecuting(false)

          // clear the old data
          setOldResult({
            status: "empty",
            result: undefined,
          })

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

        return [data, err] as any
      },
      [serverAction]
    )

    const executeWithTransition = useCallback(
      async (input: Parameters<TServerAction>[0]) => {
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

        startTransition(() => {
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

      executeWithTransition(opts.input)
    }, [executeWithTransition, opts?.input, opts?.enabled])

    useEffect(() => {
      if (!opts?.actionKey || !inputRef.current || !enabled || !$$refetch)
        return

      if (
        !getActionKeyFromArr(opts?.actionKey || []).startsWith($$refetch.key)
      ) {
        return
      }

      executeWithTransition(inputRef.current)
    }, [executeWithTransition, $$refetch])

    const refetch = useCallback(() => {
      if (!inputRef.current) return
      executeWithTransition(inputRef.current)
    }, [inputRef.current, executeWithTransition])

    const reset = useCallback(() => {
      setResult({
        isError: false,
        error: undefined,
        data: undefined,
      })
    }, [])

    let final: TServerActionResult<TServerAction>

    if (isExecuting && oldResult.status === "empty") {
      // loading state (not optimistic)
      final = {
        isLoading: true,
        isLoadingOptimistic: false,
        data: undefined,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "loading",
      }
    } else if (isExecuting && oldResult.status === "filled" && result.data) {
      // loading state (optimistic)
      final = {
        isLoading: true,
        isLoadingOptimistic: true,
        data: result.data,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "loading",
      }
    } else if (!result.isError && result.data) {
      // success state
      final = {
        isLoading: false,
        data: result.data,
        isError: false,
        isLoadingOptimistic: false,
        error: undefined,
        isSuccess: true,
        status: "success",
      }
    } else if (result.isError) {
      // error state
      final = {
        isLoading: false,
        data: undefined,
        isError: true,
        error: result.error,
        isLoadingOptimistic: false,
        isSuccess: false,
        status: "error",
      }
    } else {
      // idle state
      final = {
        isLoading: false,
        data: undefined,
        isLoadingOptimistic: false,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "idle",
      }
    }

    return {
      ...final,
      reset,
      refetch,
      execute,
      setOptimistic,
    }
  }

  return {
    useServerActionsUtils,
    useServerAction,
  }
}
