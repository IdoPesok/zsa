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
} from "../../../packages/zsa/src/utils"

describe("zsa/src/utils", () => {
  describe("instanceofZodTypeKind", () => {
    it("returns true when the type matches the provided zod type kind", () => {
      const schema = z.string()
      expect(
        instanceofZodTypeKind(schema, z.ZodFirstPartyTypeKind.ZodString)
      ).toBe(true)
      expect(
        instanceofZodTypeKind(schema, z.ZodFirstPartyTypeKind.ZodNumber)
      ).toBe(false)
    })

    it("returns false for falsy / malformed inputs without throwing", () => {
      expect(
        instanceofZodTypeKind(
          undefined as unknown as z.ZodTypeAny,
          z.ZodFirstPartyTypeKind.ZodString
        )
      ).toBe(false)
    })
  })

  describe("unwrapZodType", () => {
    it("returns the underlying type when wrapped in ZodOptional", () => {
      const schema = z.string().optional()
      expect(unwrapZodType(schema, false)._def.typeName).toBe("ZodString")
    })

    it("returns the underlying type when wrapped in ZodDefault", () => {
      const schema = z.string().default("hello")
      expect(unwrapZodType(schema, false)._def.typeName).toBe("ZodString")
    })

    it("returns the underlying type when wrapped in ZodLazy", () => {
      const schema = z.lazy(() => z.number())
      expect(unwrapZodType(schema, false)._def.typeName).toBe("ZodNumber")
    })

    it("unwraps refinements and transforms", () => {
      const refined = z.string().refine((v) => v.length > 0)
      const transformed = z.string().transform((v) => v.length)

      expect(unwrapZodType(refined, false)._def.typeName).toBe("ZodString")
      expect(unwrapZodType(transformed, false)._def.typeName).toBe("ZodString")
    })

    it("respects unwrapPreprocess for ZodEffects of kind preprocess", () => {
      const preprocessed = z.preprocess((val) => String(val), z.string())

      // When unwrapPreprocess=false, should not unwrap preprocess
      expect(unwrapZodType(preprocessed, false)._def.typeName).toBe(
        "ZodEffects"
      )
      // When unwrapPreprocess=true, should unwrap to ZodString
      expect(unwrapZodType(preprocessed, true)._def.typeName).toBe("ZodString")
    })

    it("returns the type itself when no wrapping applies", () => {
      const schema = z.number()
      expect(unwrapZodType(schema, false)).toBe(schema)
    })
  })

  describe("instanceofZodTypeObject / Array / Boolean", () => {
    it("detects the correct zod kinds", () => {
      expect(instanceofZodTypeObject(z.object({}))).toBe(true)
      expect(instanceofZodTypeObject(z.string())).toBe(false)

      expect(instanceofZodTypeArray(z.array(z.string()))).toBe(true)
      expect(instanceofZodTypeArray(z.string())).toBe(false)

      expect(instanceofZodTypeBoolean(z.boolean())).toBe(true)
      expect(instanceofZodTypeBoolean(z.string())).toBe(false)
    })
  })

  describe("isKeyAnArrayInZodSchema", () => {
    it("returns true when the given key is an array in the schema", () => {
      const schema = z.object({ tags: z.array(z.string()) })
      expect(isKeyAnArrayInZodSchema("tags", schema)).toBe(true)
    })

    it("returns false for unknown keys or non-array types", () => {
      const schema = z.object({ name: z.string() })
      expect(isKeyAnArrayInZodSchema("name", schema)).toBe(false)
      expect(isKeyAnArrayInZodSchema("missing", schema)).toBe(false)
    })

    it("returns false when the root schema is not an object", () => {
      const schema = z.string()
      expect(isKeyAnArrayInZodSchema("anything", schema)).toBe(false)
    })

    it("handles optional / default wrappers around arrays", () => {
      const schema = z.object({ tags: z.array(z.string()).optional() })
      expect(isKeyAnArrayInZodSchema("tags", schema)).toBe(true)
    })
  })

  describe("isKeyABooleanInZodSchema", () => {
    it("returns true when the given key is a boolean in the schema", () => {
      const schema = z.object({ enabled: z.boolean() })
      expect(isKeyABooleanInZodSchema("enabled", schema)).toBe(true)
    })

    it("returns false for unknown keys or non-boolean types", () => {
      const schema = z.object({ name: z.string() })
      expect(isKeyABooleanInZodSchema("name", schema)).toBe(false)
      expect(isKeyABooleanInZodSchema("missing", schema)).toBe(false)
    })
  })

  describe("formDataToJson", () => {
    it("converts plain FormData entries to a JSON object", () => {
      const schema = z.object({ name: z.string(), age: z.string() })
      const formData = new FormData()
      formData.append("name", "Alice")
      formData.append("age", "30")

      expect(formDataToJson(formData, schema)).toEqual({
        name: "Alice",
        age: "30",
      })
    })

    it("collects repeated keys into arrays for array-typed schema fields", () => {
      const schema = z.object({ tags: z.array(z.string()) })
      const formData = new FormData()
      formData.append("tags", "a")
      formData.append("tags", "b")
      formData.append("tags", "c")

      expect(formDataToJson(formData, schema)).toEqual({
        tags: ["a", "b", "c"],
      })
    })

    it("promotes a scalar to an array when the same key appears multiple times for a non-array schema", () => {
      const schema = z.object({ value: z.string() })
      const formData = new FormData()
      formData.append("value", "a")
      formData.append("value", "b")

      expect(formDataToJson(formData, schema)).toEqual({ value: ["a", "b"] })
    })

    it("coerces 'true' and 'false' strings to booleans for boolean fields", () => {
      const schema = z.object({
        isOn: z.boolean(),
        isOff: z.boolean(),
        other: z.string(),
      })
      const formData = new FormData()
      formData.append("isOn", "true")
      formData.append("isOff", "false")
      formData.append("other", "true")

      expect(formDataToJson(formData, schema)).toEqual({
        isOn: true,
        isOff: false,
        other: "true",
      })
    })
  })

  describe("addToNullishArray", () => {
    it("returns undefined when both inputs are undefined", () => {
      expect(addToNullishArray(undefined, undefined)).toBeUndefined()
    })

    it("returns the original array when value is undefined", () => {
      expect(addToNullishArray([1, 2, 3], undefined)).toEqual([1, 2, 3])
    })

    it("creates a new array when the input array is undefined", () => {
      expect(addToNullishArray(undefined, 1)).toEqual([1])
    })

    it("appends a value to a defined array", () => {
      expect(addToNullishArray([1, 2], 3)).toEqual([1, 2, 3])
    })

    it("does not mutate the original array", () => {
      const arr = [1, 2]
      addToNullishArray(arr, 3)
      expect(arr).toEqual([1, 2])
    })
  })

  describe("mergeArraysAndRemoveDuplicates", () => {
    it("returns undefined when both arrays are undefined", () => {
      expect(
        mergeArraysAndRemoveDuplicates(undefined, undefined)
      ).toBeUndefined()
    })

    it("returns array1 when array2 is undefined", () => {
      expect(mergeArraysAndRemoveDuplicates([1, 2], undefined)).toEqual([1, 2])
    })

    it("returns array2 when array1 is undefined", () => {
      expect(mergeArraysAndRemoveDuplicates(undefined, [3, 4])).toEqual([3, 4])
    })

    it("merges arrays and removes duplicates", () => {
      expect(mergeArraysAndRemoveDuplicates([1, 2, 3], [3, 4, 5])).toEqual([
        1, 2, 3, 4, 5,
      ])
    })
  })

  describe("instanceofZodTypeLikeVoid", () => {
    it("returns true for ZodVoid, ZodUndefined, and ZodNever", () => {
      expect(instanceofZodTypeLikeVoid(z.void())).toBe(true)
      expect(instanceofZodTypeLikeVoid(z.undefined())).toBe(true)
      expect(instanceofZodTypeLikeVoid(z.never())).toBe(true)
    })

    it("returns false for non-void types", () => {
      expect(instanceofZodTypeLikeVoid(z.string())).toBe(false)
      expect(instanceofZodTypeLikeVoid(z.object({}))).toBe(false)
    })
  })

  describe("canDataBeUndefinedForSchema", () => {
    it("returns true when schema is undefined", () => {
      expect(canDataBeUndefinedForSchema(undefined)).toBe(true)
    })

    it("returns true for void-like schemas", () => {
      expect(canDataBeUndefinedForSchema(z.void())).toBe(true)
      expect(canDataBeUndefinedForSchema(z.undefined())).toBe(true)
      expect(canDataBeUndefinedForSchema(z.never())).toBe(true)
    })

    it("returns true for optional or defaulted schemas", () => {
      expect(canDataBeUndefinedForSchema(z.string().optional())).toBe(true)
      expect(canDataBeUndefinedForSchema(z.string().default("x"))).toBe(true)
    })

    it("returns false for required scalar schemas", () => {
      expect(canDataBeUndefinedForSchema(z.string())).toBe(false)
      expect(canDataBeUndefinedForSchema(z.number())).toBe(false)
    })

    it("follows ZodLazy to the underlying schema", () => {
      expect(
        canDataBeUndefinedForSchema(z.lazy(() => z.string().optional()))
      ).toBe(true)
      expect(canDataBeUndefinedForSchema(z.lazy(() => z.string()))).toBe(false)
    })

    it("follows ZodEffects (refinement, transform, preprocess)", () => {
      expect(
        canDataBeUndefinedForSchema(
          z
            .string()
            .optional()
            .refine(() => true)
        )
      ).toBe(true)
      expect(
        canDataBeUndefinedForSchema(
          z
            .string()
            .optional()
            .transform((v) => v)
        )
      ).toBe(true)
      expect(
        canDataBeUndefinedForSchema(
          z.preprocess((val) => val, z.string().optional())
        )
      ).toBe(true)
      expect(canDataBeUndefinedForSchema(z.string().refine(() => true))).toBe(
        false
      )
    })
  })
})
