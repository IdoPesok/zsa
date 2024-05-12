"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react"
import { SAWError } from "./errors"
import { TAnyZodSafeFunctionHandler } from "./safe-zod-function"

export type TServerActionResult<
  TServerAction extends TAnyZodSafeFunctionHandler,
> =
  | {
      // loading state
      isLoading: true
      data: undefined | NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      isError: false
      error: undefined
      isSuccess: false
      status: "loading"
      setOptimistic: (
        data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      ) => void
    }
  | {
      // idle state
      isLoading: false
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "idle"
      setOptimistic: (
        data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      ) => void
    }
  | {
      // error state
      isLoading: false
      data: undefined
      isError: true
      error: unknown
      isSuccess: false
      status: "error"
      setOptimistic: (
        data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      ) => void
    }
  | {
      isLoading: false
      data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
      setOptimistic: (
        data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      ) => void
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

    return context
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
      data: undefined | NonNullable<Awaited<ReturnType<TServerAction>>[0]>
    }

    const enabled = opts?.enabled ?? true
    const [, startTransition] = useTransition()
    const [result, setResult] = useState<TResult>({
      isError: false,
      error: undefined,
      data: undefined,
    })
    const [input, setInput] = useState<
      Parameters<TServerAction>[0] | undefined
    >(opts?.input ? opts.input : undefined)
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
        setInput(input)

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

    const setOptimistic = useCallback(
      async (data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>) => {
        startTransition(() => {
          setOldResult({
            status: "filled",
            result: { ...result },
          })

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
      if (opts === undefined || !enabled) return
      executeWithTransition(opts.input)
    }, [executeWithTransition, opts?.input, enabled])

    useEffect(() => {
      if (!opts?.actionKey || !input || !enabled || !$$refetch) return

      if (
        !getActionKeyFromArr(opts?.actionKey || []).startsWith($$refetch.key)
      ) {
        return
      }

      executeWithTransition(input)
    }, [executeWithTransition, $$refetch])

    const refetch = useCallback(() => {
      if (!input) return
      executeWithTransition(input)
    }, [input, executeWithTransition])

    const reset = useCallback(() => {
      setResult({
        isError: false,
        error: undefined,
        data: undefined,
      })
    }, [])

    let final: TServerActionResult<TServerAction>

    if (isExecuting) {
      // loading state
      final = {
        isLoading: true,
        data: undefined,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "loading",
        setOptimistic,
      }
    } else if (!result.isError && result.data) {
      // success state
      final = {
        isLoading: false,
        data: result.data,
        isError: false,
        error: undefined,
        isSuccess: true,
        status: "success",
        setOptimistic,
      }
    } else if (result.isError) {
      // error state
      final = {
        isLoading: false,
        data: undefined,
        isError: true,
        error: result.error,
        isSuccess: false,
        status: "error",
        setOptimistic,
      }
    } else {
      // idle state
      final = {
        isLoading: false,
        data: undefined,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "idle",
        setOptimistic,
      }
    }

    return {
      ...final,
      reset,
      refetch,
      execute,
    }
  }

  return {
    useServerActionsUtils,
    useServerAction,
  }
}
