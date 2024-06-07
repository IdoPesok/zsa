import { z } from "zod"
import {
  TSchemaInput,
  TSchemaOrZodUndefined,
  TSchemaOrZodUnknown,
  TSchemaOutput,
} from "./types"

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

type TInputFieldErrors = "$inputFieldErrors$"
type TInputFormErrors = "$inputFormErrors$"
type TInputFormattedErrors = "$inputFormattedErrors$"
type TOutputFieldErrors = "$outputFieldErrors$"
type TOutputFormErrors = "$outputFormErrors$"
type TOutputFormattedErrors = "$outputFormattedErrors$"

type TInputRaw = "$inputRaw$"
type TInputParsed = "$inputParsed$"

interface TZodSchemaErrors<T extends z.ZodType> {
  fieldErrors: z.inferFlattenedErrors<T>["fieldErrors"]
  formErrors: z.inferFlattenedErrors<T>["formErrors"]
  formattedErrors: z.inferFormattedError<T>
}

export interface TReplaceMap<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
> {
  ["$inputFieldErrors$"]: z.inferFlattenedErrors<TInputSchema>["fieldErrors"]
  ["$inputFormErrors$"]: z.inferFlattenedErrors<TInputSchema>["formErrors"]
  ["$inputFormattedErrors$"]: z.inferFormattedError<TInputSchema>
  ["$outputFieldErrors$"]: z.inferFlattenedErrors<TOutputSchema>["fieldErrors"]
  ["$outputFormErrors$"]: z.inferFlattenedErrors<TOutputSchema>["formErrors"]
  ["$outputFormattedErrors$"]: z.inferFormattedError<TOutputSchema>
  ["$inputRaw$"]: TSchemaInput<TInputSchema>
  ["$inputParsed$"]: TSchemaOrZodUndefined<TInputSchema> | undefined
}

export type TReplaceErrorPlaceholders<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TError extends any,
> = TError extends Object
  ? {
      [K in keyof TError]: NonNullable<TError[K]> extends infer TKey
        ? TKey extends keyof TReplaceMap<any, any>
          ? TReplaceMap<TInputSchema, TOutputSchema>[TKey]
          : TError[K]
        : TError[K]
    }
  : TError

/**
 *  A ZSAError is an error that can be thrown by a server action.
 */
export class ZSAError<
  TInputSchema extends z.ZodType | undefined = any,
  TOutputSchema extends z.ZodType | undefined = any,
  TPlaceholder extends boolean = false,
> extends Error {
  /** the Error object thrown */
  public readonly data: unknown
  /** the error code */
  public readonly code: keyof typeof ERROR_CODES

  public readonly inputParseErrors?: TPlaceholder extends false
    ? TZodSchemaErrors<TSchemaOrZodUndefined<TInputSchema>>
    : {
        fieldErrors: TInputFieldErrors
        formErrors: TInputFormErrors
        formattedErrors: TInputFormattedErrors
      }

  public readonly outputParseErrors?: TPlaceholder extends false
    ? TZodSchemaErrors<TSchemaOrZodUnknown<TOutputSchema>>
    : {
        fieldErrors: TOutputFieldErrors
        formErrors: TOutputFormErrors
        formattedErrors: TOutputFormattedErrors
      }

  public inputRaw: TPlaceholder extends false
    ? TSchemaInput<TInputSchema>
    : TInputRaw
  public inputParsed: TPlaceholder extends false
    ? TSchemaOutput<TInputSchema> | undefined
    : TInputParsed

  constructor(
    code: keyof typeof ERROR_CODES = ERROR_CODES.ERROR,
    data?: unknown,
    more?: {
      inputParseErrors?: TZodSchemaErrors<TSchemaOrZodUndefined<TInputSchema>>
      outputParseErrors?: TZodSchemaErrors<TSchemaOrZodUnknown<TOutputSchema>>
      inputParsed?: TSchemaOutput<TInputSchema>
    }
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

    // @ts-expect-error
    this.inputParseErrors = more?.inputParseErrors

    // @ts-expect-error
    this.outputParseErrors = more?.outputParseErrors

    // @ts-expect-error
    this.inputParsed = more?.inputParsed

    // @ts-expect-error
    this.inputRaw = "123"
  }
}

/**
 * A TZSAError is a ZSAError that is thrown by a server action that has a type
 */
export type TZSAError<TInputSchema extends z.ZodType | undefined> = Omit<
  Error,
  "stack" | "cause"
> &
  (
    | {
        code: Exclude<keyof typeof ERROR_CODES, "INPUT_PARSE_ERROR">
        message?: string
        data: string
        name: string
        fieldErrors?: undefined
        formErrors?: undefined
        formattedErrors?: undefined
      }
    | {
        message?: string
        code: "INPUT_PARSE_ERROR"
        data: string
        name: string
        fieldErrors: z.inferFlattenedErrors<
          TSchemaOrZodUndefined<TInputSchema>
        >["fieldErrors"]
        formErrors: z.inferFlattenedErrors<
          TSchemaOrZodUndefined<TInputSchema>
        >["formErrors"]
        formattedErrors: z.inferFormattedError<
          TSchemaOrZodUndefined<TInputSchema>
        >
      }
  )
