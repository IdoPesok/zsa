/**
 * @jest-environment node
 */
import { z } from "zod"
import { ZSAError } from "zsa"
import {
  errorResponseObject,
  getParameterObjects,
  getRequestBodyObject,
  getResponsesObject,
} from "../../../packages/zsa-openapi/src/schema"

describe("zsa-openapi / schema", () => {
  describe("getParameterObjects", () => {
    it("returns undefined when the input is void and there are no path parameters", () => {
      expect(
        getParameterObjects(z.void(), [], "all", undefined)
      ).toBeUndefined()
    })

    it("throws when the schema is not a zod validator", () => {
      expect(() =>
        getParameterObjects({} as any, [], "all", undefined)
      ).toThrow(ZSAError)
    })

    it("throws when the (unwrapped) schema is not a zod object", () => {
      expect(() =>
        getParameterObjects(z.string(), [], "all", undefined)
      ).toThrow(/must be a ZodObject/)
    })

    it("throws when a path parameter is not present in the schema", () => {
      expect(() =>
        getParameterObjects(
          z.object({ foo: z.string() }),
          ["missing"],
          "all",
          undefined
        )
      ).toThrow(/expects key from path/)
    })

    it("builds parameter objects with correct 'in' locations", () => {
      const schema = z.object({
        id: z.string(),
        search: z.string().optional(),
      })
      const params = getParameterObjects(schema, ["id"], "all", {
        id: "42",
        search: "hello",
      })
      expect(params).toHaveLength(2)

      const byName = Object.fromEntries(params!.map((p) => [p.name, p]))
      expect(byName["id"]).toMatchObject({
        name: "id",
        in: "path",
        required: true,
        example: "42",
      })
      expect(byName["search"]).toMatchObject({
        name: "search",
        in: "query",
        required: false,
        example: "hello",
      })
    })

    it("filters parameters by inType='path'", () => {
      const schema = z.object({ id: z.string(), q: z.string() })
      const params = getParameterObjects(schema, ["id"], "path", undefined)
      expect(params).toHaveLength(1)
      expect(params![0]!.name).toBe("id")
    })

    it("filters parameters by inType='query'", () => {
      const schema = z.object({ id: z.string(), q: z.string() })
      const params = getParameterObjects(schema, ["id"], "query", undefined)
      expect(params).toHaveLength(1)
      expect(params![0]!.name).toBe("q")
    })

    it("accepts coercible types (number, boolean) alongside strings", () => {
      const schema = z.object({
        id: z.string(),
        page: z.number(),
        active: z.boolean(),
      })
      const params = getParameterObjects(schema, ["id"], "all", undefined)
      expect(params).toHaveLength(3)
    })

    it("rejects path parameters that are optional", () => {
      const schema = z.object({ id: z.string().optional() })
      expect(() =>
        getParameterObjects(schema, ["id"], "all", undefined)
      ).toThrow(/must not be optional/)
    })

    it("rejects non-string, non-coercible fields", () => {
      const schema = z.object({ id: z.string(), payload: z.object({}) })
      expect(() =>
        getParameterObjects(schema, ["id"], "all", undefined)
      ).toThrow(/must be ZodString/)
    })
  })

  describe("getRequestBodyObject", () => {
    it("returns undefined when input is void and there are no path params", () => {
      expect(
        getRequestBodyObject(z.void(), [], ["application/json"], undefined)
      ).toBeUndefined()
    })

    it("throws when the schema is not a zod validator", () => {
      expect(() =>
        getRequestBodyObject({} as any, [], ["application/json"], undefined)
      ).toThrow(ZSAError)
    })

    it("throws when the schema is not an object", () => {
      expect(() =>
        getRequestBodyObject(z.string(), [], ["application/json"], undefined)
      ).toThrow(/must be a ZodObject/)
    })

    it("returns a body object containing the schema for every content type", () => {
      const schema = z.object({ name: z.string(), age: z.number() })
      const body = getRequestBodyObject(
        schema,
        [],
        ["application/json", "application/x-www-form-urlencoded"],
        { name: "Ada", age: 36 }
      )
      expect(body).toBeDefined()
      expect(body!.required).toBe(true)
      expect(Object.keys(body!.content)).toEqual([
        "application/json",
        "application/x-www-form-urlencoded",
      ])
      expect(body!.content["application/json"]!.example).toEqual({
        name: "Ada",
        age: 36,
      })
    })

    it("returns a non-required body for optional schemas", () => {
      const schema = z.object({ name: z.string() }).optional()
      const body = getRequestBodyObject(
        schema,
        [],
        ["application/json"],
        undefined
      )
      expect(body!.required).toBe(false)
    })

    it("strips path parameters from the body schema and example", () => {
      const schema = z.object({ id: z.string(), name: z.string() })
      const body = getRequestBodyObject(schema, ["id"], ["application/json"], {
        id: "abc",
        name: "Ada",
      })
      expect(body).toBeDefined()
      expect(body!.content["application/json"]!.example).toEqual({
        name: "Ada",
      })
    })

    it("returns undefined when every remaining key is a path parameter", () => {
      const schema = z.object({ id: z.string() })
      expect(
        getRequestBodyObject(schema, ["id"], ["application/json"], undefined)
      ).toBeUndefined()
    })
  })

  describe("getResponsesObject", () => {
    it("builds a response object for a concrete schema", () => {
      const responses = getResponsesObject(
        z.object({ ok: z.boolean() }),
        { ok: true },
        undefined
      )
      expect(responses[200]).toBeDefined()
      const ok = responses[200] as any
      expect(ok.description).toBe("Successful response")
      expect(ok.content["application/json"].example).toEqual({ ok: true })
      expect(responses.default).toEqual({
        $ref: "#/components/responses/error",
      })
    })

    it("falls back to z.unknown() when no schema is provided", () => {
      const responses = getResponsesObject(undefined, undefined, undefined)
      expect(responses[200]).toBeDefined()
    })

    it("passes through headers when provided", () => {
      const responses = getResponsesObject(undefined, undefined, {
        "x-custom": { description: "demo", schema: { type: "string" } },
      })
      const ok = responses[200] as any
      expect(ok.headers["x-custom"].description).toBe("demo")
    })

    it("throws when given a non-zod, non-undefined schema", () => {
      expect(() => getResponsesObject({} as any, undefined, undefined)).toThrow(
        /must be a ZodObject/
      )
    })
  })

  describe("errorResponseObject", () => {
    it("has the expected shape", () => {
      expect(errorResponseObject.description).toBe("Error response")
      expect(
        errorResponseObject.content!["application/json"]!.schema
      ).toBeDefined()
    })
  })
})
