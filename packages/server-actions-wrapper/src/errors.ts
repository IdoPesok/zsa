/** An enum of error codes */
const ERROR_CODES = {
  INPUT_PARSE_ERROR: "INPUT_PARSE_ERROR",
  OUTPUT_PARSE_ERROR: "OUTPUT_PARSE_ERROR",
  ERROR: "ERROR",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  TIMEOUT: "TIMEOUT",
} as const

/**
 *  A SAWError is an error that can be thrown by a server action.
 */
export class SAWError extends Error {
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
 * A TSAWError is a SAWError that is thrown by a server action that has a type
 */
export interface TSAWError extends Error {
  code: keyof typeof ERROR_CODES
  data: string
}
