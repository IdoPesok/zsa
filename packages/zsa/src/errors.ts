import { z } from "zod"

/** An enum of error codes */
const ERROR_CODES = {
  INPUT_PARSE_ERROR: "INPUT_PARSE_ERROR",
  OUTPUT_PARSE_ERROR: "OUTPUT_PARSE_ERROR",
  ERROR: "ERROR",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  TIMEOUT: "TIMEOUT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PRECONDITION_FAILED: "PRECONDITION_FAILED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  METHOD_NOT_SUPPORTED: "METHOD_NOT_SUPPORTED",
  UNPROCESSABLE_CONTENT: "UNPROCESSABLE_CONTENT",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  CLIENT_CLOSED_REQUEST: "CLIENT_CLOSED_REQUEST",
} as const

/**
 *  A ZSAError is an error that can be thrown by a server action.
 */
export class ZSAError extends Error {
  /** the Error object thrown */
  public readonly data: unknown
  /** the error code */
  public readonly code: keyof typeof ERROR_CODES

  constructor(
    code: keyof typeof ERROR_CODES = ERROR_CODES.ERROR,
    data?: unknown
  ) {
    super()
    this.data = data
    this.code = code

    if (data instanceof Error) {
      this.message = data.message
      this.stack = data.stack
      this.name = data.name
      this.cause = data.cause
    }

    if (!this.message && typeof this.data === "string") {
      this.message = this.data
    }
  }
}

/**
 * A TZSAError is a ZSAError that is thrown by a server action that has a type
 */
export type TZSAError<TInputSchema extends z.ZodType> = Error &
  (
    | {
        code: Exclude<keyof typeof ERROR_CODES, "INPUT_PARSE_ERROR">
        message?: string
        stack: string
        data: string
        name: string
        fieldErrors?: undefined
        formErrors?: undefined
        formattedErrors?: undefined
      }
    | {
        message?: string
        stack: string
        code: "INPUT_PARSE_ERROR"
        data: string
        name: string
        fieldErrors: z.inferFlattenedErrors<TInputSchema>["fieldErrors"]
        formErrors: z.inferFlattenedErrors<TInputSchema>["formErrors"]
        formattedErrors: z.inferFormattedError<TInputSchema>
      }
  )
