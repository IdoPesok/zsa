import { createContext, useCallback, useState } from "react"

export type TServerActionUtilsContext<T extends string[]> = {
  $$refetch:
    | undefined
    | {
        timestamp: number
        key: string
      }
  refetch: (keys: T) => void
}

export const ServerActionUtilsContext = createContext<
  TServerActionUtilsContext<string[]>
>({
  $$refetch: undefined,
  refetch: () => {},
})

const ACTION_KEY_SEPARATOR = "<|break|>"
export const getActionKeyFromArr = (arr: string[]) =>
  arr.join(ACTION_KEY_SEPARATOR)

/**
 * A provider that provides the `refetch` function to the children
 */
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
