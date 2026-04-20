/**
 * @jest-environment jsdom
 */
import { z } from "zod"
import {
  addToNullishArray,
  canDataBeUndefinedForSchema,
  formDataToJson,
  instanceofZodTypeArray,
  instanceofZodTypeBoolean,
  instanceofZodTypeKind,
  instanceofZodTypeLikeVoid,
  instanceofZodTypeObject,
  isKeyABooleanInZodSchema,
  isKeyAnArrayInZodSchema,
  mergeArraysAndRemoveDuplicates,
  unwrapZodType,
} from "zsa"

describe("zsa / utils", () => {
  describe("instanceofZodTypeKind", () => {
    it("returns true when the typeName matches", () => {
      expect(
        instanceofZodTypeKind(z.string(), z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(true)
      expect(
        instanceofZodTypeKind(z.number(), z.ZodFirstPartyTypeKind.ZodNumber)
      ).toBe(true)
    })

    it("returns false when the typeName does not match", () => {
      expect(
        instanceofZodTypeKind(z.string(), z.ZodFirstPartyTypeKind.ZodNumber)
      ).toBe(false)
    })

    it("returns false for non-zod inputs", () => {
      expect(
        instanceofZodTypeKind(null as any, z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(false)
      expect(
        instanceofZodTypeKind({} as any, z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(false)
    })
  })

  describe("unwrapZodType", () => {
    it("returns the same schema for primitive types", () => {
      const s = z.string()
      expect(unwrapZodType(s, false)).toBe(s)
    })

    it("unwraps optional wrappers", () => {
      const inner = z.string()
      const unwrapped = unwrapZodType(inner.optional(), false)
      expect(
        instanceofZodTypeKind(unwrapped, z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(true)
    })

    it("unwraps default wrappers", () => {
      const unwrapped = unwrapZodType(z.number().default(5), false)
      expect(
        instanceofZodTypeKind(unwrapped, z.ZodFirstPartyTypeKind.ZodNumber)
      ).toBe(true)
    })

    it("unwraps lazy wrappers", () => {
      const unwrapped = unwrapZodType(
        z.lazy(() => z.boolean()),
        false
      )
      expect(
        instanceofZodTypeKind(unwrapped, z.ZodFirstPartyTypeKind.ZodBoolean)
      ).toBe(true)
    })

    it("unwraps nested optional/default/lazy chains", () => {
      const schema = z.lazy(() => z.string().default("x").optional())
      const unwrapped = unwrapZodType(schema, false)
      expect(
        instanceofZodTypeKind(unwrapped, z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(true)
    })

    it("unwraps refinement and transform effects", () => {
      const refined = z.string().refine((s) => s.length > 0)
      expect(
        instanceofZodTypeKind(
          unwrapZodType(refined, false),
          z.ZodFirstPartyTypeKind.ZodString
        )
      ).toBe(true)

      const transformed = z.number().transform((n) => n + 1)
      expect(
        instanceofZodTypeKind(
          unwrapZodType(transformed, false),
          z.ZodFirstPartyTypeKind.ZodNumber
        )
      ).toBe(true)
    })

    it("only unwraps preprocess when unwrapPreprocess is true", () => {
      const schema = z.preprocess((v) => String(v), z.string())
      const notUnwrapped = unwrapZodType(schema, false)
      expect(
        instanceofZodTypeKind(notUnwrapped, z.ZodFirstPartyTypeKind.ZodEffects)
      ).toBe(true)

      const unwrapped = unwrapZodType(schema, true)
      expect(
        instanceofZodTypeKind(unwrapped, z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(true)
    })
  })

  describe("type guards", () => {
    it("instanceofZodTypeObject", () => {
      expect(instanceofZodTypeObject(z.object({}))).toBe(true)
      expect(instanceofZodTypeObject(z.string())).toBe(false)
    })

    it("instanceofZodTypeArray", () => {
      expect(instanceofZodTypeArray(z.array(z.number()))).toBe(true)
      expect(instanceofZodTypeArray(z.string())).toBe(false)
    })

    it("instanceofZodTypeBoolean", () => {
      expect(instanceofZodTypeBoolean(z.boolean())).toBe(true)
      expect(instanceofZodTypeBoolean(z.string())).toBe(false)
    })

    it("instanceofZodTypeLikeVoid", () => {
      expect(instanceofZodTypeLikeVoid(z.void())).toBe(true)
      expect(instanceofZodTypeLikeVoid(z.undefined())).toBe(true)
      expect(instanceofZodTypeLikeVoid(z.never())).toBe(true)
      expect(instanceofZodTypeLikeVoid(z.string())).toBe(false)
      expect(instanceofZodTypeLikeVoid(z.null())).toBe(false)
    })
  })

  describe("isKeyAnArrayInZodSchema", () => {
    const schema = z.object({
      tags: z.array(z.string()),
      nestedTags: z.array(z.string()).optional(),
      name: z.string(),
    })

    it("returns true for array-typed keys", () => {
      expect(isKeyAnArrayInZodSchema("tags", schema)).toBe(true)
    })

    it("returns true for optional arrays (after unwrap)", () => {
      expect(isKeyAnArrayInZodSchema("nestedTags", schema)).toBe(true)
    })

    it("returns false for non-array keys", () => {
      expect(isKeyAnArrayInZodSchema("name", schema)).toBe(false)
    })

    it("returns false for missing keys", () => {
      expect(isKeyAnArrayInZodSchema("missing", schema)).toBe(false)
    })

    it("returns false when the schema isn't an object", () => {
      expect(isKeyAnArrayInZodSchema("anything", z.string())).toBe(false)
    })
  })

  describe("isKeyABooleanInZodSchema", () => {
    const schema = z.object({
      active: z.boolean(),
      activeOpt: z.boolean().optional(),
      name: z.string(),
    })

    it("returns true for boolean-typed keys (also when wrapped in optional)", () => {
      expect(isKeyABooleanInZodSchema("active", schema)).toBe(true)
      expect(isKeyABooleanInZodSchema("activeOpt", schema)).toBe(true)
    })

    it("returns false for non-boolean keys and missing keys", () => {
      expect(isKeyABooleanInZodSchema("name", schema)).toBe(false)
      expect(isKeyABooleanInZodSchema("missing", schema)).toBe(false)
    })
  })

  describe("formDataToJson", () => {
    const buildFormData = (
      entries: Array<[string, string | File]>
    ): FormData => {
      const fd = new FormData()
      entries.forEach(([k, v]) => fd.append(k, v))
      return fd
    }

    it("converts single-value entries into a flat object", () => {
      const schema = z.object({
        name: z.string(),
        email: z.string(),
      })
      const fd = buildFormData([
        ["name", "Ada"],
        ["email", "ada@example.com"],
      ])
      expect(formDataToJson(fd, schema)).toEqual({
        name: "Ada",
        email: "ada@example.com",
      })
    })

    it("aggregates repeated keys as arrays when the schema declares an array", () => {
      const schema = z.object({
        tags: z.array(z.string()),
      })
      const fd = buildFormData([
        ["tags", "a"],
        ["tags", "b"],
        ["tags", "c"],
      ])
      expect(formDataToJson(fd, schema)).toEqual({ tags: ["a", "b", "c"] })
    })

    it("wraps single values for array schemas into a one-element array", () => {
      const schema = z.object({
        tags: z.array(z.string()),
      })
      const fd = buildFormData([["tags", "a"]])
      expect(formDataToJson(fd, schema)).toEqual({ tags: ["a"] })
    })

    it("coerces 'true'/'false' strings for boolean-schema keys", () => {
      const schema = z.object({
        accepted: z.boolean(),
        declined: z.boolean(),
        name: z.string(),
      })
      const fd = buildFormData([
        ["accepted", "true"],
        ["declined", "false"],
        ["name", "true"],
      ])
      expect(formDataToJson(fd, schema)).toEqual({
        accepted: true,
        declined: false,
        name: "true",
      })
    })

    it("promotes a single value to an array when a key repeats but the schema is not an array", () => {
      const schema = z.object({
        flavor: z.string(),
      })
      const fd = buildFormData([
        ["flavor", "vanilla"],
        ["flavor", "chocolate"],
      ])
      expect(formDataToJson(fd, schema)).toEqual({
        flavor: ["vanilla", "chocolate"],
      })
    })
  })

  describe("addToNullishArray", () => {
    it("returns undefined when both inputs are nullish", () => {
      expect(addToNullishArray(undefined, undefined)).toBeUndefined()
    })

    it("returns the existing array when value is undefined", () => {
      const arr = [1, 2]
      expect(addToNullishArray(arr, undefined)).toBe(arr)
    })

    it("creates a new array containing only the value when the array is undefined", () => {
      expect(addToNullishArray(undefined, "x")).toEqual(["x"])
    })

    it("appends the value to a copy of the array without mutating the original", () => {
      const arr = [1, 2]
      const result = addToNullishArray(arr, 3)
      expect(result).toEqual([1, 2, 3])
      expect(arr).toEqual([1, 2])
      expect(result).not.toBe(arr)
    })
  })

  describe("mergeArraysAndRemoveDuplicates", () => {
    it("returns undefined when both inputs are undefined", () => {
      expect(
        mergeArraysAndRemoveDuplicates(undefined, undefined)
      ).toBeUndefined()
    })

    it("returns the first array when the second is undefined", () => {
      const arr = [1, 2]
      expect(mergeArraysAndRemoveDuplicates(arr, undefined)).toBe(arr)
    })

    it("returns the second array when the first is undefined", () => {
      const arr = [1, 2]
      expect(mergeArraysAndRemoveDuplicates(undefined, arr)).toBe(arr)
    })

    it("merges and deduplicates two arrays", () => {
      expect(mergeArraysAndRemoveDuplicates([1, 2, 3], [3, 4, 5])).toEqual([
        1, 2, 3, 4, 5,
      ])
    })

    it("preserves insertion order and deduplicates objects by reference", () => {
      const a = { x: 1 }
      const b = { x: 2 }
      expect(mergeArraysAndRemoveDuplicates([a], [a, b])).toEqual([a, b])
    })
  })

  describe("canDataBeUndefinedForSchema", () => {
    it("returns true when the schema is undefined", () => {
      expect(canDataBeUndefinedForSchema(undefined)).toBe(true)
    })

    it.each([
      ["void", z.void()],
      ["undefined", z.undefined()],
      ["never", z.never()],
      ["optional", z.string().optional()],
      ["default", z.string().default("x")],
    ])("returns true for %s schemas", (_label, schema) => {
      expect(canDataBeUndefinedForSchema(schema)).toBe(true)
    })

    it("returns true for lazy schemas whose inner type can be undefined", () => {
      expect(
        canDataBeUndefinedForSchema(z.lazy(() => z.string().optional()))
      ).toBe(true)
      expect(canDataBeUndefinedForSchema(z.lazy(() => z.string()))).toBe(false)
    })

    it.each([
      ["refinement", z.string().refine((s) => s.length > 0)],
      ["transform", z.string().transform((s) => s.length)],
      ["preprocess", z.preprocess((v) => String(v), z.string().optional())],
    ])("propagates through %s effects", (_label, schema) => {
      // All inner schemas allow undefined (or would after transform chain)
      expect(typeof canDataBeUndefinedForSchema(schema)).toBe("boolean")
    })

    it("returns false for required primitive schemas", () => {
      expect(canDataBeUndefinedForSchema(z.string())).toBe(false)
      expect(canDataBeUndefinedForSchema(z.number())).toBe(false)
      expect(canDataBeUndefinedForSchema(z.object({}))).toBe(false)
    })
  })
})
