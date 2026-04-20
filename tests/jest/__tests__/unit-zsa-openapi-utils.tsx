import {
  acceptsRequestBody,
  getErrorStatusFromZSAError,
  getPathParameters,
  getPathRegExp,
  normalizePath,
  preparePathForMatching,
} from "../../../packages/zsa-openapi/src/utils"

describe("zsa-openapi/src/utils", () => {
  describe("acceptsRequestBody", () => {
    it("returns false for GET and DELETE", () => {
      expect(acceptsRequestBody("GET")).toBe(false)
      expect(acceptsRequestBody("DELETE")).toBe(false)
    })

    it("returns true for POST, PUT, PATCH, and any other method", () => {
      expect(acceptsRequestBody("POST")).toBe(true)
      expect(acceptsRequestBody("PUT")).toBe(true)
      expect(acceptsRequestBody("PATCH")).toBe(true)
      expect(acceptsRequestBody("HEAD")).toBe(true)
    })
  })

  describe("normalizePath", () => {
    it("ensures a single leading slash and no trailing slash", () => {
      expect(normalizePath("users")).toBe("/users")
      expect(normalizePath("/users")).toBe("/users")
      expect(normalizePath("/users/")).toBe("/users")
      expect(normalizePath("users/")).toBe("/users")
    })

    it("handles an empty path", () => {
      expect(normalizePath("")).toBe("/")
    })
  })

  describe("getPathParameters", () => {
    it("extracts path parameter names enclosed in curly braces", () => {
      expect(getPathParameters("/users/{id}")).toEqual(["id"])
      expect(getPathParameters("/users/{userId}/posts/{postId}")).toEqual([
        "userId",
        "postId",
      ])
    })

    it("returns an empty array when no parameters are present", () => {
      expect(getPathParameters("/users")).toEqual([])
    })
  })

  describe("preparePathForMatching", () => {
    it("replaces { and } with colons and empty strings", () => {
      expect(preparePathForMatching("/users/{id}")).toBe("/users/:id")
      expect(preparePathForMatching("/users/{userId}/posts/{postId}")).toBe(
        "/users/:userId/posts/:postId"
      )
    })
  })

  describe("getPathRegExp", () => {
    it("produces a RegExp that matches the path with named groups", () => {
      const re = getPathRegExp("/users/{id}")
      const match = "/users/42".match(re)

      expect(match).not.toBeNull()
      expect(match!.groups).toEqual({ id: "42" })
    })

    it("is case-insensitive", () => {
      const re = getPathRegExp("/Users/{id}")
      expect("/users/7".match(re)).not.toBeNull()
    })

    it("does not match paths with unexpected segments", () => {
      const re = getPathRegExp("/users/{id}")
      expect("/users/42/extra".match(re)).toBeNull()
    })
  })

  describe("getErrorStatusFromZSAError", () => {
    it("returns 500 for unknown or malformed errors", () => {
      expect(getErrorStatusFromZSAError(undefined)).toBe(500)
      expect(getErrorStatusFromZSAError(null)).toBe(500)
      expect(getErrorStatusFromZSAError("string error")).toBe(500)
      expect(getErrorStatusFromZSAError({})).toBe(500)
      expect(getErrorStatusFromZSAError({ code: "NOT_A_REAL_CODE" })).toBe(500)
    })

    it.each([
      ["INTERNAL_SERVER_ERROR", 500],
      ["INPUT_PARSE_ERROR", 400],
      ["OUTPUT_PARSE_ERROR", 500],
      ["ERROR", 500],
      ["NOT_AUTHORIZED", 401],
      ["TIMEOUT", 408],
      ["FORBIDDEN", 403],
      ["NOT_FOUND", 404],
      ["CONFLICT", 409],
      ["PRECONDITION_FAILED", 412],
      ["PAYLOAD_TOO_LARGE", 413],
      ["METHOD_NOT_SUPPORTED", 405],
      ["UNPROCESSABLE_CONTENT", 422],
      ["TOO_MANY_REQUESTS", 429],
      ["CLIENT_CLOSED_REQUEST", 499],
      ["INSUFFICIENT_CREDITS", 402],
      ["PAYMENT_REQUIRED", 402],
    ])("maps %s to HTTP %d", (code, expected) => {
      expect(getErrorStatusFromZSAError({ code })).toBe(expected)
    })
  })
})
