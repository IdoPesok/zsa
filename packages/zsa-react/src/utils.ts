import { useCallback, useRef, useState } from "react"

/**
 * Like `useState`, but also returns a ref whose `.current` is always kept in
 * sync with the latest state value.
 *
 * This lets callers read the most recent value synchronously from event
 * handlers / effects (via the ref) without paying the re-render-after-setState
 * roundtrip. The returned setter updates both the state and the ref in one go.
 */
export const useStateWithRef = <T>(initial: T | (() => T)) => {
  const [state, $setState] = useState<T>(initial)
  const ref = useRef<T>(state)

  const setState = useCallback((value: T) => {
    $setState(value)
    ref.current = value
  }, [])

  return [state, setState, ref] as const
}

export const mergePossibleObjects = (obj1: any, obj2: any) => {
  if (obj1 === undefined && obj2 === undefined) {
    return undefined
  }

  if (obj1 === undefined) return obj2
  if (obj2 === undefined) return obj1

  // both obj1 and obj2 are present

  // if either of them aren't objects, return the second one as we can't merge
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    return obj2
  }

  return {
    ...obj1,
    ...obj2,
  }
}
