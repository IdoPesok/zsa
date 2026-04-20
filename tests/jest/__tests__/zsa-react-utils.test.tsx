/**
 * @jest-environment jsdom
 */
import { mergePossibleObjects } from "../../../packages/zsa-react/src/utils"

describe("zsa-react / utils", () => {
  describe("mergePossibleObjects", () => {
    it("returns undefined when both inputs are undefined", () => {
      expect(mergePossibleObjects(undefined, undefined)).toBeUndefined()
    })

    it("returns the second object when the first is undefined", () => {
      const obj = { a: 1 }
      expect(mergePossibleObjects(undefined, obj)).toBe(obj)
    })

    it("returns the first object when the second is undefined", () => {
      const obj = { a: 1 }
      expect(mergePossibleObjects(obj, undefined)).toBe(obj)
    })

    it("returns the second value when the first is not an object", () => {
      expect(mergePossibleObjects("hello", { a: 1 })).toEqual({ a: 1 })
      expect(mergePossibleObjects(42, { a: 1 })).toEqual({ a: 1 })
    })

    it("returns the second value when the second is not an object", () => {
      expect(mergePossibleObjects({ a: 1 }, "hello")).toBe("hello")
      expect(mergePossibleObjects({ a: 1 }, 42)).toBe(42)
    })

    it("shallow-merges two objects, with obj2 winning on conflicts", () => {
      const merged = mergePossibleObjects({ a: 1, b: 2 }, { b: 3, c: 4 })
      expect(merged).toEqual({ a: 1, b: 3, c: 4 })
    })

    it("does not mutate input objects", () => {
      const a = { a: 1 }
      const b = { b: 2 }
      const merged = mergePossibleObjects(a, b)
      expect(a).toEqual({ a: 1 })
      expect(b).toEqual({ b: 2 })
      expect(merged).toEqual({ a: 1, b: 2 })
      expect(merged).not.toBe(a)
      expect(merged).not.toBe(b)
    })
  })
})
