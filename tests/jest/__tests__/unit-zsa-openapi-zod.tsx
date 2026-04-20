import { z } from "zod"
import {
  instanceofZodType,
  instanceofZodTypeCoercible,
  instanceofZodTypeLikeString,
  instanceofZodTypeOptional,
  zodSupportsCoerce,
} from "../../../packages/zsa-openapi/src/zod"

describe("zsa-openapi/src/zod", () => {
  describe("instanceofZodType", () => {
    it("returns true for zod schemas", () => {
      expect(instanceofZodType(z.string())).toBe(true)
      expect(instanceofZodType(z.object({}))).toBe(true)
    })

    it("returns false for non-zod values", () => {
      expect(instanceofZodType(undefined)).toBe(false)
      expect(instanceofZodType(null)).toBe(false)
      expect(instanceofZodType({})).toBe(false)
      expect(instanceofZodType({ _def: {} })).toBe(false)
    })
  })

  describe("instanceofZodTypeOptional", () => {
    it("returns true only for ZodOptional", () => {
      expect(instanceofZodTypeOptional(z.string().optional())).toBe(true)
      expect(instanceofZodTypeOptional(z.string())).toBe(false)
    })
  })

  describe("instanceofZodTypeLikeString", () => {
    it("returns true for plain strings and optional/default wrappers", () => {
      expect(instanceofZodTypeLikeString(z.string())).toBe(true)
      expect(instanceofZodTypeLikeString(z.string().optional())).toBe(true)
      expect(instanceofZodTypeLikeString(z.string().default("x"))).toBe(true)
    })

    it("returns true for enums and string literals", () => {
      expect(instanceofZodTypeLikeString(z.enum(["a", "b"]))).toBe(true)
      expect(instanceofZodTypeLikeString(z.literal("hello"))).toBe(true)
    })

    it("returns true for native enums with only string values", () => {
      enum StrEnum {
        A = "a",
        B = "b",
      }
      expect(instanceofZodTypeLikeString(z.nativeEnum(StrEnum))).toBe(true)
    })

    it("returns false for native enums that include numbers", () => {
      enum MixedEnum {
        A = 1,
        B = "b",
      }
      expect(instanceofZodTypeLikeString(z.nativeEnum(MixedEnum))).toBe(false)
    })

    it("treats preprocess effects as string-like", () => {
      const schema = z.preprocess((v) => String(v), z.number())
      expect(instanceofZodTypeLikeString(schema)).toBe(true)
    })

    it("returns true for unions whose members are all string-like", () => {
      const good = z.union([z.string(), z.enum(["a", "b"]), z.literal("x")])
      const bad = z.union([z.string(), z.number()])
      expect(instanceofZodTypeLikeString(good)).toBe(true)
      expect(instanceofZodTypeLikeString(bad)).toBe(false)
    })

    it("returns true for intersections of two string-like schemas", () => {
      const good = z.intersection(z.string(), z.string())
      const bad = z.intersection(z.string(), z.number())
      expect(instanceofZodTypeLikeString(good)).toBe(true)
      expect(instanceofZodTypeLikeString(bad)).toBe(false)
    })

    it("returns false for numeric or boolean schemas", () => {
      expect(instanceofZodTypeLikeString(z.number())).toBe(false)
      expect(instanceofZodTypeLikeString(z.boolean())).toBe(false)
    })

    it("returns false for numeric literals", () => {
      expect(instanceofZodTypeLikeString(z.literal(42))).toBe(false)
    })
  })

  describe("instanceofZodTypeCoercible", () => {
    it("returns true for numbers, booleans, bigints, and dates", () => {
      expect(instanceofZodTypeCoercible(z.number())).toBe(true)
      expect(instanceofZodTypeCoercible(z.boolean())).toBe(true)
      expect(instanceofZodTypeCoercible(z.bigint())).toBe(true)
      expect(instanceofZodTypeCoercible(z.date())).toBe(true)
    })

    it("returns true even when the coercible type is wrapped", () => {
      expect(instanceofZodTypeCoercible(z.number().optional())).toBe(true)
      expect(instanceofZodTypeCoercible(z.number().default(0))).toBe(true)
    })

    it("returns false for strings and objects", () => {
      expect(instanceofZodTypeCoercible(z.string())).toBe(false)
      expect(instanceofZodTypeCoercible(z.object({}))).toBe(false)
    })
  })

  describe("zodSupportsCoerce", () => {
    it("is true for modern zod versions used in this repo", () => {
      expect(zodSupportsCoerce).toBe(true)
    })
  })
})
