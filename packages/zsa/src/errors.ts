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
  }
}

/**
 * A TZSAError is a ZSAError that is thrown by a server action that has a type
 */
export interface TZSAError extends Error {
  code: keyof typeof ERROR_CODES
  data: string
}
