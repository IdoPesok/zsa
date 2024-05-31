export const addToNullishArray = <T>(
  array: Array<T> | undefined,
  value: T | undefined
) => {
  if (!array && !value) return undefined
  if (!value) return array

  const temp = [...(array || [])]
  temp.push(value)

  return temp
}

export const mergeArraysAndRemoveDuplicates = <T>(
  array1: Array<T> | undefined,
  array2: Array<T> | undefined
) => {
  if (!array1 && !array2) return undefined
  if (!array2) return array1
  if (!array1) return array2

  const temp = [...(array1 || []), ...(array2 || [])]
  return [...new Set(temp)]
}
