"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react"
import { TAnyZodSafeFunctionHandler } from "server-actions-wrapper"

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
    }
  | {
      // idle state
      isLoading: false
      data: undefined
      isError: false
      error: undefined
      isSuccess: false
      status: "idle"
    }
  | {
      // error state
      isLoading: false
      data: undefined
      isError: true
      error: unknown
      isSuccess: false
      status: "error"
    }
  | {
      isLoading: false
      data: NonNullable<Awaited<ReturnType<TServerAction>>[0]>
      isError: false
      error: undefined
      isSuccess: true
      status: "success"
    }

type TServerActionUtilsContext = {
  $$refetch: Record<string, number | undefined>
  refetch: (key: string) => void
}

const ServerActionUtilsContext = createContext<TServerActionUtilsContext>({
  $$refetch: {},
  refetch: () => {},
})

export function ServerActionUtilsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [refetchState, setRefetchState] = useState<
    TServerActionUtilsContext["$$refetch"]
  >({})

  const refetch = useCallback((key: string) => {
    setRefetchState((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
  }, [])

  return (
    <ServerActionUtilsContext.Provider
      value={{ refetch, $$refetch: refetchState }}
    >
      {children}
    </ServerActionUtilsContext.Provider>
  )
}

export const useServerActionsUtils = () => {
  const context = useContext(ServerActionUtilsContext)

  if (context === undefined) {
    const defaultState: TServerActionUtilsContext = {
      $$refetch: {},
      refetch: () => {},
    }

    return defaultState
  }

  return context
}

export const useServerAction = <
  const TServerAction extends TAnyZodSafeFunctionHandler,
>(
  serverAction: TServerAction,
  opts?: {
    input: Parameters<TServerAction>[0]
    refetchKey?: string
    enabled?: boolean
  }
) => {
  const enabled = opts?.enabled ?? true
  const [, startTransition] = useTransition()
  const [result, setResult] = useState<{
    isError: boolean
    error: undefined | unknown
    data: undefined | NonNullable<Awaited<ReturnType<TServerAction>>[0]>
  }>({
    isError: false,
    error: undefined,
    data: undefined,
  })
  const [input, setInput] = useState<Parameters<TServerAction>[0] | undefined>(
    opts?.input ? opts.input : undefined
  )
  const [isExecuting, setIsExecuting] = useState(opts !== undefined && enabled)
  const { $$refetch } = useServerActionsUtils()

  const execute = useCallback(
    async (
      input: Parameters<TServerAction>[0]
    ): Promise<Awaited<ReturnType<TServerAction>>> => {
      setIsExecuting(true)
      setInput(input)

      const [data, err] = await serverAction(input)

      if (err) {
        setResult({ error: err, isError: true, data: undefined })
        setIsExecuting(false)
        return [data, err] as any
      }

      setResult({
        isError: false,
        error: undefined,
        data: data ?? undefined,
      })
      setIsExecuting(false)

      return [data, err] as any
    },
    [serverAction]
  )

  useEffect(() => {
    if (opts === undefined || !enabled) return
    execute(opts.input)
  }, [execute, opts?.input, enabled])

  useEffect(() => {
    if (!opts?.refetchKey || !input || !enabled) return
    execute(input)
  }, [$$refetch[opts?.refetchKey || "never match"]])

  const refetch = useCallback(() => {
    if (!input) return
    execute(input)
  }, [input, execute])

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
    }
  }

  return {
    ...final,
    reset,
    refetch,
    execute,
  }
}
