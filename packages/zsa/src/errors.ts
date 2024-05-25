/** An enum of error codes */
const ERROR_CODES = {
  INPUT_PARSE_ERROR: "INPUT_PARSE_ERROR",
  OUTPUT_PARSE_ERROR: "OUTPUT_PARSE_ERROR",
  ERROR: "ERROR",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  TIMEOUT: "TIMEOUT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
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
