/**
 * @jest-environment node
 */
import { z } from "zod"
import {
  instanceofZodType,
  instanceofZodTypeCoercible,
  instanceofZodTypeLikeString,
  instanceofZodTypeOptional,
  zodSupportsCoerce,
} from "../../../packages/zsa-openapi/src/zod"

describe("zsa-openapi / zod helpers", () => {
  describe("instanceofZodType", () => {
    it("returns true for zod schemas", () => {
      expect(instanceofZodType(z.string())).toBe(true)
      expect(instanceofZodType(z.number())).toBe(true)
      expect(instanceofZodType(z.object({ a: z.string() }))).toBe(true)
    })

    it("returns false for non-zod values", () => {
      expect(instanceofZodType(null)).toBe(false)
      expect(instanceofZodType(undefined)).toBe(false)
      expect(instanceofZodType({})).toBe(false)
      expect(instanceofZodType({ _def: {} })).toBe(false)
      expect(instanceofZodType("hello")).toBe(false)
    })
  })

  describe("instanceofZodTypeOptional", () => {
    it("returns true only for optional schemas", () => {
      expect(instanceofZodTypeOptional(z.string().optional())).toBe(true)
      expect(instanceofZodTypeOptional(z.string())).toBe(false)
      expect(instanceofZodTypeOptional(z.string().nullable())).toBe(false)
    })
  })

  describe("instanceofZodTypeLikeString", () => {
    it("recognizes strings and string-like wrappers", () => {
      expect(instanceofZodTypeLikeString(z.string())).toBe(true)
      expect(instanceofZodTypeLikeString(z.string().optional())).toBe(true)
      expect(instanceofZodTypeLikeString(z.string().default("x"))).toBe(true)
      expect(instanceofZodTypeLikeString(z.lazy(() => z.string()))).toBe(true)
    })

    it("recognizes string literals but not non-string literals", () => {
      expect(instanceofZodTypeLikeString(z.literal("hi"))).toBe(true)
      expect(instanceofZodTypeLikeString(z.literal(5))).toBe(false)
      expect(instanceofZodTypeLikeString(z.literal(true))).toBe(false)
    })

    it("recognizes unions only when every option is string-like", () => {
      expect(
        instanceofZodTypeLikeString(z.union([z.string(), z.literal("x")]))
      ).toBe(true)
      expect(
        instanceofZodTypeLikeString(z.union([z.string(), z.number()]))
      ).toBe(false)
    })

    it("recognizes intersections only when both sides are string-like", () => {
      expect(
        instanceofZodTypeLikeString(z.intersection(z.string(), z.string()))
      ).toBe(true)
      expect(
        instanceofZodTypeLikeString(z.intersection(z.string(), z.number()))
      ).toBe(false)
    })

    it("recognizes enums and string native enums but not numeric native enums", () => {
      expect(instanceofZodTypeLikeString(z.enum(["a", "b"]))).toBe(true)

      enum StringEnum {
        A = "a",
        B = "b",
      }
      expect(instanceofZodTypeLikeString(z.nativeEnum(StringEnum))).toBe(true)

      enum NumericEnum {
        A = 1,
        B = 2,
      }
      expect(instanceofZodTypeLikeString(z.nativeEnum(NumericEnum))).toBe(false)
    })

    it("treats preprocess effects as string-like", () => {
      const schema = z.preprocess((v) => String(v), z.string())
      expect(instanceofZodTypeLikeString(schema)).toBe(true)
    })

    it("unwraps refinement/transform effects before checking", () => {
      expect(
        instanceofZodTypeLikeString(z.string().refine((s) => s.length > 0))
      ).toBe(true)
      expect(
        instanceofZodTypeLikeString(z.string().transform((s) => s.length))
      ).toBe(true)
    })

    it("returns false for non-string primitive schemas", () => {
      expect(instanceofZodTypeLikeString(z.number())).toBe(false)
      expect(instanceofZodTypeLikeString(z.boolean())).toBe(false)
      expect(instanceofZodTypeLikeString(z.object({}))).toBe(false)
    })
  })

  describe("zodSupportsCoerce", () => {
    it("is true for modern zod versions", () => {
      expect(zodSupportsCoerce).toBe(true)
    })
  })

  describe("instanceofZodTypeCoercible", () => {
    it.each([
      ["number", z.number()],
      ["boolean", z.boolean()],
      ["bigint", z.bigint()],
      ["date", z.date()],
    ])("returns true for %s", (_label, schema) => {
      expect(instanceofZodTypeCoercible(schema)).toBe(true)
    })

    it("returns true for coercible types wrapped in optional/default", () => {
      expect(instanceofZodTypeCoercible(z.number().optional())).toBe(true)
      expect(instanceofZodTypeCoercible(z.number().default(1))).toBe(true)
    })

    it("does not unwrap preprocess wrappers (unwrapPreprocess=false)", () => {
      expect(instanceofZodTypeCoercible(z.preprocess(Number, z.number()))).toBe(
        false
      )
    })

    it("returns false for strings and objects", () => {
      expect(instanceofZodTypeCoercible(z.string())).toBe(false)
      expect(instanceofZodTypeCoercible(z.object({}))).toBe(false)
      expect(instanceofZodTypeCoercible(z.array(z.number()))).toBe(false)
    })
  })
})
