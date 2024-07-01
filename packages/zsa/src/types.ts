import { AnyZodObject, objectUtil, z, ZodObject } from "zod"
import { NextRequest } from "./api"
import {
  TOnCompleteFn,
  TOnErrorFn,
  TOnStartFn,
  TOnSuccessFn,
} from "./callbacks"
import {
  TReplaceErrorPlaceholders,
  TypedProxyError,
  TZSAError,
  ZSAError,
} from "./errors"

export type TFinalError<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TIsProcedure extends boolean,
> = TError extends TShapeErrorNotSet
  ? TZSAError<TInputSchema> // if there is no shapeError, return a ZSAError
  : TIsProcedure extends true
    ? TError // if we are in a procedure, return the error to keep the placeholders
    : TReplaceErrorPlaceholders<
        TSchemaOrZodUndefined<TInputSchema>,
        TSchemaOrZodUnknown<TOutputSchema>,
        TError
      > // if we are not in a procedure, return the error without the placeholders

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

// this class can only be made on the server side
export class TOptsSource {
  public validate: () => boolean
  constructor(validate: () => true) {
    this.validate = validate
  }
}

export interface THandlerOpts<TProcedureChainOutput extends any> {
  /** The context of the handler */
  ctx?: TProcedureChainOutput
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
  /** on args */
  onArgs?: (args: any) => void
  /** on parsed args */
  onParsedArgs?: (args: any) => void
  /** the source of the opts */
  source: TOptsSource
  /** whether the handler is from an OpenAPI handler */
  isFromOpenApiHandler?: boolean
  /** on input schema evaluated */
  onInputSchema?: (schema: z.ZodType) => void
  /** previous input schema */
  previousInputSchema?: z.ZodType
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
  evaluateInputSchema: 1,
  getFinalStaticInputSchema: 1,
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
  inputSchema: TInputSchemaFn<any, any> | TInputSchema

  /** The final output schema of the handler */
  outputSchema: TOutputSchema | TOutputSchemaFn<any>

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
  onErrorFns?: Array<TOnErrorFn<any, any>> | undefined

  /** the type of input */
  inputType?: InputTypeOptions

  /** A function to run when the handler starts */
  onStartFns?: Array<TOnStartFn<any, any>> | undefined

  /** A function to run when the handler succeeds */
  onSuccessFns?: Array<TOnSuccessFn<any, any, any>> | undefined

  /** A function to run when the handler completes (success or error) */
  onCompleteFns?: Array<TOnCompleteFn<any, any, any, any>> | undefined

  /** Boolean indicating if the procedure has a parent */
  isChained?: boolean | undefined

  /** Boolean indicating if the handler is a procedure */
  isProcedure?: TIsProcedure | undefined

  /** The handler function */
  handler?: TAnyZodSafeFunctionHandler | undefined

  /** A function to run when the handler errors to customize the error */
  shapeErrorFns: Array<TShapeErrorFn> | undefined

  /** boolean indicating if the previous data is returned when there is an error **/
  persistedDataWhenError?: boolean | undefined
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

export interface TShapeErrorFn<TError extends any = TShapeErrorNotSet> {
  (args: {
    err: unknown
    typedData: TypedProxyError
    ctx: TError extends TShapeErrorNotSet ? undefined : TError
  }): any
}

export interface TInputSchemaFn<
  TPreviousInputSchema extends z.ZodType | undefined,
  TProcedureChainOutput extends any,
> {
  (
    args: {
      ctx: TProcedureChainOutput
      previousSchema: TSchemaOrZodUndefined<TPreviousInputSchema>
    } & Pick<THandlerOpts<any>, "previousState" | "request" | "responseMeta">
  ): z.ZodType | Promise<z.ZodType>
}

export interface TOutputSchemaFn<TProcedureChainOutput extends any> {
  (
    args: {
      ctx: TProcedureChainOutput
      unparsedData: unknown
    } & Pick<THandlerOpts<any>, "previousState" | "request" | "responseMeta">
  ): z.ZodType | Promise<z.ZodType>
}

export type TFinalInputSchema<T extends z.ZodType | TInputSchemaFn<any, any>> =
  T extends TInputSchemaFn<any, any> ? Awaited<ReturnType<T>> : T

export type TFinalOutputSchema<T extends z.ZodType | TOutputSchemaFn<any>> =
  T extends TOutputSchemaFn<any> ? Awaited<ReturnType<T>> : T

export type TZodMerge<
  T1 extends z.ZodType | undefined,
  T2 extends z.ZodType | undefined,
> = T1 extends AnyZodObject
  ? T2 extends AnyZodObject
    ? ZodObject<
        objectUtil.extendShape<T1["shape"], T2["shape"]>,
        T2["_def"]["unknownKeys"],
        T2["_def"]["catchall"]
      >
    : T2 extends undefined
      ? T1 // only return T1 if T2 is undefined
      : T2
  : T2
