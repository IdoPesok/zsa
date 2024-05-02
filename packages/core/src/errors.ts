const ERROR_CODES = {
  INPUT_PARSE_ERROR: "INPUT_PARSE_ERROR",
  OUTPUT_PARSE_ERROR: "OUTPUT_PARSE_ERROR",
  ERROR: "ERROR",
} as const;

export class ZodSafeFunctionError extends Error {
  public readonly data: unknown;
  public readonly code: keyof typeof ERROR_CODES;

  constructor(
    data: unknown,
    code: keyof typeof ERROR_CODES = ERROR_CODES.ERROR
  ) {
    super();
    this.data = data;
    this.code = code;
  }
}
