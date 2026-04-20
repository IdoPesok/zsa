/**
 * @jest-environment node
 */
import {
  acceptsRequestBody,
  getErrorStatusFromZSAError,
  getPathParameters,
  getPathRegExp,
  normalizePath,
  preparePathForMatching,
} from "../../../packages/zsa-openapi/src/utils"

describe("zsa-openapi / utils", () => {
  describe("acceptsRequestBody", () => {
    it.each([
      ["GET", false],
      ["DELETE", false],
      ["POST", true],
      ["PUT", true],
      ["PATCH", true],
      ["OPTIONS", true],
      ["HEAD", true],
    ])("returns %s for %s", (method, expected) => {
      expect(acceptsRequestBody(method)).toBe(expected)
    })
  })

  describe("normalizePath", () => {
    it("adds a leading slash when missing", () => {
      expect(normalizePath("foo")).toBe("/foo")
    })

    it("preserves a single leading slash", () => {
      expect(normalizePath("/foo")).toBe("/foo")
    })

    it("strips a trailing slash", () => {
      expect(normalizePath("/foo/")).toBe("/foo")
      expect(normalizePath("foo/")).toBe("/foo")
    })

    it("strips both leading and trailing slashes and re-adds only the leading", () => {
      expect(normalizePath("/foo/bar/")).toBe("/foo/bar")
    })

    it("returns '/' for empty input", () => {
      expect(normalizePath("")).toBe("/")
    })

    it("does not strip internal slashes", () => {
      expect(normalizePath("a/b/c")).toBe("/a/b/c")
    })
  })

  describe("getPathParameters", () => {
    it("returns an empty array when no parameters exist", () => {
      expect(getPathParameters("/users")).toEqual([])
    })

    it("extracts a single parameter", () => {
      expect(getPathParameters("/users/{id}")).toEqual(["id"])
    })

    it("extracts multiple parameters preserving order", () => {
      expect(getPathParameters("/users/{userId}/posts/{postId}")).toEqual([
        "userId",
        "postId",
      ])
    })

    it("supports multi-character parameter names", () => {
      expect(getPathParameters("/{teamSlug}/items/{itemId}")).toEqual([
        "teamSlug",
        "itemId",
      ])
    })
  })

  describe("preparePathForMatching", () => {
    it("converts OpenAPI-style params to colon-prefixed params", () => {
      expect(preparePathForMatching("/users/{id}")).toBe("/users/:id")
    })

    it("converts multiple params", () => {
      expect(preparePathForMatching("/u/{u}/p/{p}")).toBe("/u/:u/p/:p")
    })

    it("leaves paths without params unchanged", () => {
      expect(preparePathForMatching("/users")).toBe("/users")
    })
  })

  describe("getPathRegExp", () => {
    it("matches a literal path", () => {
      const re = getPathRegExp("/users")
      expect(re.test("/users")).toBe(true)
      expect(re.test("/users/")).toBe(false)
      expect(re.test("/Users")).toBe(true)
    })

    it("captures a single named group", () => {
      const re = getPathRegExp("/users/{id}")
      const match = "/users/42".match(re)
      expect(match).not.toBeNull()
      expect(match!.groups).toEqual({ id: "42" })
    })

    it("captures multiple named groups", () => {
      const re = getPathRegExp("/users/{userId}/posts/{postId}")
      const match = "/users/abc/posts/123".match(re)
      expect(match).not.toBeNull()
      expect(match!.groups).toEqual({ userId: "abc", postId: "123" })
    })

    it("does not allow slashes within a captured segment", () => {
      const re = getPathRegExp("/users/{id}")
      expect(re.test("/users/42/extra")).toBe(false)
    })

    it("is case-insensitive", () => {
      const re = getPathRegExp("/Users/{id}")
      expect(re.test("/users/1")).toBe(true)
      expect(re.test("/USERS/1")).toBe(true)
    })
  })

  describe("getErrorStatusFromZSAError", () => {
    it("returns 500 for a non-object error", () => {
      expect(getErrorStatusFromZSAError(null)).toBe(500)
      expect(getErrorStatusFromZSAError(undefined)).toBe(500)
      expect(getErrorStatusFromZSAError("oops")).toBe(500)
      expect(getErrorStatusFromZSAError(42)).toBe(500)
    })

    it("returns 500 when the error has no code property", () => {
      expect(getErrorStatusFromZSAError({})).toBe(500)
      expect(getErrorStatusFromZSAError({ message: "x" })).toBe(500)
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
    ])("maps %s to status %s", (code, expected) => {
      expect(getErrorStatusFromZSAError({ code })).toBe(expected)
    })

    it("returns 500 for an unknown error code", () => {
      expect(getErrorStatusFromZSAError({ code: "SOMETHING_ELSE" })).toBe(500)
    })
  })
})
