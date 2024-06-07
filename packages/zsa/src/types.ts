import { z } from "zod"
import { NextRequest } from "./api"
import {
  TOnCompleteFn,
  TOnErrorFn,
  TOnStartFn,
  TOnSuccessFn,
} from "./callbacks"
import { TReplaceErrorPlaceholders, TZSAError, ZSAError } from "./errors"

export type TFinalError<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TIsProcedure extends boolean,
> = TError extends TShapeErrorNotSet
  ? TZSAError<TInputSchema>
  : TIsProcedure extends true
    ? TError
    : TReplaceErrorPlaceholders<
        TSchemaOrZodUndefined<TInputSchema>,
        TSchemaOrZodUnknown<TOutputSchema>,
        TError
      >

export type TSchemaOrZodUndefined<T extends z.ZodType | undefined> =
  T extends z.ZodType ? T : z.ZodUndefined

export type TSchemaOrZodUnknown<T extends z.ZodType | undefined> =
  T extends z.ZodType ? T : z.ZodUnknown

export type TSchemaInput<T extends z.ZodType | undefined> = T extends z.ZodType
  ? T["_input"]
  : undefined

export type TSchemaOutput<T extends z.ZodType | undefined> = T extends z.ZodType
  ? T["_output"]
  : undefined

export type TSchemaOutputOrUnknown<T extends z.ZodType | undefined> =
  T extends z.ZodType ? T["_output"] : unknown

/** Replace void with undefined */
type TCleanData<T extends Promise<any>> =
  Extract<Awaited<T>, void> extends never
    ? Awaited<T>
    : Exclude<Awaited<T>, void> | undefined

/** The return type of a server action */
export type TDataOrError<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TData extends Promise<any>,
  TError extends any,
  TIsProcedure extends boolean,
> =
  | Promise<[TCleanData<TData>, null]>
  | Promise<
      [null, TFinalError<TInputSchema, TOutputSchema, TError, TIsProcedure>]
    >

/** The return type of a server action */
export type TDataOrErrorOrNull<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TData extends Promise<any>,
  TError extends any,
> =
  | [TCleanData<TData>, null]
  | [null, TFinalError<TInputSchema, TOutputSchema, TError, false>]
  | [null, null]

/** A configuration object for retrying a server action */
export interface RetryConfig {
  /** The maximum number of times to retry the action. Inclusive. */
  maxAttempts: number
  /**
   * The delay in milliseconds between each retry attempt.
   *
   * Can either be a number (ms) or a function that takes the
   * current attempt number and the error as arguments and returns a number of ms.
   *
   * NOTE: The current attempt starts at 2
   * (the first attempt errored then the current attempt becomes is 2)
   *
   * @example
   * Exponential backoff
   * ```ts
   * delay: (currentAttempt) =>
   *   Math.min(
   *     currentAttempt > 2 ? 2 ** currentAttempt * 1000 : 1000,
   *     30 * 1000
   *   ),
   * ```
   *
   * @example
   * Linear backoff
   * ```ts
   * delay: (currentAttempt) =>
   *   (currentAttempt - 1) * 1000,
   * ```
   */
  delay?: number | ((currentAttempt: number, err: ZSAError) => number)
}

export interface THandlerOpts<TProcedureChainOutput extends any> {
  /** The context of the handler */
  ctx?: TProcedureChainOutput
  /** Override the input schema */
  overrideInputSchema?: z.ZodType
  /** return the input schema */
  returnInputSchema?: boolean
  /** return the output schema */
  returnOutputSchema?: boolean
  /** an associated request object from OpenAPI handlers */
  request?: NextRequest
  /** an object containing response metadata for OpenAPI handlers */
  responseMeta?: ZSAResponseMeta
  /** the number of attempts the handler has made */
  attempts?: number
  /** the previous state */
  previousState?: any
}

/** A function type for a handler that does not have an input */
export interface TNoInputHandlerFunc<
  TRet extends any,
  TInputSchema extends undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TProcedureChainOutput extends any,
  TIsProcedure extends boolean,
> {
  (
    placeholder?: undefined,
    $overrideArgs?: undefined,
    $opts?: THandlerOpts<TProcedureChainOutput>
  ): TDataOrError<
    TInputSchema,
    TOutputSchema,
    TOutputSchema extends z.ZodType ? TOutputSchema["_output"] : TRet,
    TError,
    TIsProcedure
  >
}

/** A function type for a handler that has an input */
export interface THandlerFunc<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TRet extends any,
  TProcedureChainOutput extends any,
  TInputType extends InputTypeOptions,
  TIsProcedure extends boolean,
> {
  (
    /** The input to the handler */
    args: TInputType extends "json" ? TSchemaInput<TInputSchema> : FormData,
    /** Override the args */
    $overrideArgs?: Partial<TSchemaInput<TInputSchema>>,
    /** Options for the handler */
    $opts?: THandlerOpts<TProcedureChainOutput>
  ): TDataOrError<
    TInputSchema,
    TOutputSchema,
    TOutputSchema extends z.ZodType ? TOutputSchema["_output"] : TRet,
    TError,
    TIsProcedure
  >
}

/** A function type for a handler that has an input */
export interface TStateHandlerFunc<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TRet extends any,
> {
  (
    /** The previous state */
    previousState: any,
    /** Override the args */
    formData: FormData
  ): TDataOrErrorOrNull<
    TInputSchema,
    TOutputSchema,
    TOutputSchema extends z.ZodType ? TOutputSchema["_output"] : TRet,
    TError
  >
}

export type TAnyStateHandlerFunc = TStateHandlerFunc<any, any, any, any>

/** a helper type to hold the status of a timeout */
export interface TimeoutStatus {
  isTimeout: boolean
}

/** which keys should be default omitted from the safe zod function */
export const DefaultOmitted = {
  $internals: 1,
  handleError: 1,
  onInputParseError: 1,
  getTimeoutErrorPromise: 1,
  getProcedureChainOutput: 1,
  handleSuccess: 1,
  handleStart: 1,
  parseInputData: 1,
  parseOutputData: 1,
  onOutputParseError: 1,
  checkTimeoutStatus: 1,
  getRetryDelay: 1,
} as const

export type TZodSafeFunctionDefaultOmitted = keyof typeof DefaultOmitted

/** A combination of both a no input handler and a handler */
export type TAnyZodSafeFunctionHandler<
  TInputSchema extends z.ZodType | undefined = any,
  TOutputSchema extends z.ZodType | undefined = any,
  TData extends Promise<any> = Promise<any>,
  TError extends any = any,
  TIsProcedure extends boolean = boolean,
> =
  | ((
      input: any,
      overrideArgs?: any,
      opts?: THandlerOpts<any>
    ) => TDataOrError<TInputSchema, TOutputSchema, TData, TError, TIsProcedure>)
  | ((
      placeholder?: undefined,
      overrideArgs?: undefined,
      opts?: THandlerOpts<any>
    ) => TDataOrError<TInputSchema, TOutputSchema, TData, TError, TIsProcedure>)

/** infer input schema */
export type inferInputSchemaFromHandler<
  THandler extends TAnyZodSafeFunctionHandler,
> =
  THandler extends TAnyZodSafeFunctionHandler<infer TInputSchema>
    ? TInputSchema
    : THandler extends TStateHandlerFunc<infer TInputSchema, any, any, any>
      ? TInputSchema
      : z.ZodType | undefined

/**
 * A data type for the internals of a Zod Safe Function
 */
export interface TInternals<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TIsProcedure extends boolean,
> {
  /**
   *
   * A chain of handler functions to run before the main handler (if any)
   *
   * These would come from the procedure chain
   *
   */
  procedureHandlerChain: TAnyZodSafeFunctionHandler[]

  /** The final input schema of the handler */
  inputSchema: TInputSchema

  /** The final output schema of the handler */
  outputSchema: TOutputSchema

  /** A function to run when an input parse error occurs */
  onInputParseError?: ((err: z.ZodError<TInputSchema>) => any) | undefined

  /** A function to run when the output parse error occurs */
  onOutputParseError?: ((err: z.ZodError<TOutputSchema>) => any) | undefined

  /**
   * The timeout of the handler in milliseconds
   */
  timeout?: number | undefined

  /**
   * The retry configuration of the handler
   */
  retryConfig?: RetryConfig | undefined

  /** A function to run when the handler errors */
  onErrorFn?: TOnErrorFn<TError, TIsProcedure> | undefined

  /** the type of input */
  inputType?: InputTypeOptions

  /** A function to run when the handler starts */
  onStartFn?: TOnStartFn<TInputSchema, TIsProcedure> | undefined

  /** A function to run when the handler succeeds */
  onSuccessFn?:
    | TOnSuccessFn<TInputSchema, TOutputSchema, TIsProcedure>
    | undefined

  /** A function to run when the handler completes (success or error) */
  onCompleteFn?:
    | TOnCompleteFn<TInputSchema, TOutputSchema, TError, TIsProcedure>
    | undefined

  /** The procedure function to run when an error occurs */
  onErrorFromProcedureFn?: Array<TOnErrorFn<TError, true>> | undefined

  /** The procedure function to run when the handler starts */
  onStartFromProcedureFn?: Array<TOnStartFn<TInputSchema, true>> | undefined

  /** The procedure function to run when the handler succeeds */
  onSuccessFromProcedureFn?:
    | Array<TOnSuccessFn<TInputSchema, TOutputSchema, true>>
    | undefined

  /** The procedure function to run when the handler completes (success or error) */
  onCompleteFromProcedureFn?:
    | Array<TOnCompleteFn<TInputSchema, TOutputSchema, TError, true>>
    | undefined

  /** Boolean indicating if the procedure has a parent */
  isChained?: boolean | undefined

  /** Boolean indicating if the handler is a procedure */
  isProcedure?: TIsProcedure | undefined

  /** The handler function */
  handler?: TAnyZodSafeFunctionHandler | undefined

  /** A function to run when the handler errors to customize the error */
  shapeErrorFn: TShapeErrorFn | TShapeErrorNotSet
}

export type InputTypeOptions = "formData" | "json" | "state"

/**
 * A class representing a ZSA response meta object
 */
export class ZSAResponseMeta {
  /**
   * the headers of the response
   */
  headers: Headers
  /**
   * the status code of the response
   *
   * @default 200
   */
  statusCode: number

  constructor() {
    this.statusCode = 200
    this.headers = new Headers()
  }
}

export type PrettifyNested<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: PrettifyNested<T[K]>
      }
    : T

export const ShapeErrorNotSet = "ShapeErrorNotSet" as const
export type TShapeErrorNotSet = typeof ShapeErrorNotSet

export interface TShapeErrorFn {
  (args: { err: unknown; zsaError: ZSAError<any, any, true> | undefined }): any
}
