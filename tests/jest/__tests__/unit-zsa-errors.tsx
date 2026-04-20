import { ZSAError } from "../../../packages/zsa/src/errors"

describe("zsa/src/errors - ZSAError", () => {
  it("defaults code to ERROR when no arguments are provided", () => {
    const err = new ZSAError()
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ZSAError)
    expect(err.code).toBe("ERROR")
    expect(err.data).toBeUndefined()
    expect(err.message).toBe("")
  })

  it("accepts an explicit code and preserves it", () => {
    const err = new ZSAError("NOT_AUTHORIZED", "you shall not pass")
    expect(err.code).toBe("NOT_AUTHORIZED")
    expect(err.data).toBe("you shall not pass")
  })

  it("uses a string data payload as the message when no error is thrown", () => {
    const err = new ZSAError("INPUT_PARSE_ERROR", "bad input")
    expect(err.message).toBe("bad input")
  })

  it("copies fields from an Error passed as data", () => {
    const inner = new Error("oops")
    inner.name = "CustomError"
    inner.stack = "fake-stack"
    inner.cause = { source: "unit-test" }

    const err = new ZSAError("INTERNAL_SERVER_ERROR", inner)

    expect(err.message).toBe("oops")
    expect(err.name).toBe("CustomError")
    expect(err.stack).toBe("fake-stack")
    expect(err.cause).toEqual({ source: "unit-test" })
    expect(err.data).toBe(inner)
  })

  it("stores input and output parse errors when provided", () => {
    const inputParseErrors = {
      fieldErrors: { name: ["Required"] },
      formErrors: ["Bad form"],
      formattedErrors: { _errors: [] },
    } as any
    const outputParseErrors = {
      fieldErrors: {},
      formErrors: ["Bad output"],
      formattedErrors: { _errors: [] },
    } as any

    const err = new ZSAError("OUTPUT_PARSE_ERROR", "failed", {
      inputParseErrors,
      outputParseErrors,
    })

    expect(err.inputParseErrors).toBe(inputParseErrors)
    expect(err.outputParseErrors).toBe(outputParseErrors)
  })

  it("treats non-string, non-error data as opaque and leaves message empty", () => {
    const err = new ZSAError("TIMEOUT", { some: "object" })
    expect(err.code).toBe("TIMEOUT")
    expect(err.message).toBe("")
    expect(err.data).toEqual({ some: "object" })
  })
})
