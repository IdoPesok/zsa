const ERROR_CODES = {
  INPUT_PARSE_ERROR: "INPUT_PARSE_ERROR",
  OUTPUT_PARSE_ERROR: "OUTPUT_PARSE_ERROR",
  ERROR: "ERROR",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
} as const;

export class SAWError extends Error {
  public readonly data: unknown;
  public readonly code: keyof typeof ERROR_CODES;

  constructor(
    code: keyof typeof ERROR_CODES = ERROR_CODES.ERROR,
    data?: unknown,
  ) {
    super();
    this.data = data;
    this.code = code;
  }
}
