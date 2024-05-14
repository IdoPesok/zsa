/** Deep clone a value */
export function clone<T>(value: T): T {
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

/** Compare two values for deep equality */
export function deepEqual(a: any, b: any): boolean {
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
