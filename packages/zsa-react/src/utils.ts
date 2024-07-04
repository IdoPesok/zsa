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
