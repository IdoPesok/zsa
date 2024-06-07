import z from "zod"
import {
  TSchemaInput,
  TSchemaOutput,
  TSchemaOutputOrUnknown,
  TShapeErrorNotSet,
} from "./types"

/** An error handler function */
export interface TOnErrorFn<TError, TIsProcedure> {
  (
    err: TIsProcedure extends true
      ? unknown
      : TError extends TShapeErrorNotSet
        ? unknown
        : TError
  ): any
}

/** A start handler function */
export interface TOnStartFn<
  TInputSchema extends z.ZodType | undefined,
  TIsProcedure extends boolean,
> {
  (value: {
    /** The known args passed to the handler */
    args: TIsProcedure extends false ? TSchemaInput<TInputSchema> : unknown
  }): any
}

/** A success handler function */
export interface TOnSuccessFn<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TIsProcedure extends boolean,
> {
  (value: {
    /** The known args passed to the handler */
    args: TIsProcedure extends false ? TSchemaOutput<TInputSchema> : unknown
    /** The successful data returned from the handler */
    data: TIsProcedure extends false
      ? TSchemaOutputOrUnknown<TOutputSchema>
      : unknown
  }): any
}

/**
 * A complete handler function
 *
 * Runs after onSuccess or onError
 */
export interface TOnCompleteFn<
  TInputSchema extends z.ZodType | undefined,
  TOutputSchema extends z.ZodType | undefined,
  TError extends any,
  TIsProcedure extends boolean,
> {
  (
    value:
      | {
          /** A boolean indicating if the action was successful */
          isSuccess: true
          /** A boolean indicating if the action was an error */
          isError: false
          /** The status of the action */
          status: "success"
          /** The known args passed to the handler */
          args: TIsProcedure extends false
            ? TSchemaOutput<TInputSchema>
            : unknown
          /** The successful data returned from the handler */
          data: TIsProcedure extends false
            ? TSchemaOutputOrUnknown<TOutputSchema>
            : unknown
        }
      | {
          /** A boolean indicating if the action was successful */
          isSuccess: false
          /** A boolean indicating if the action was an error */
          isError: true
          /** The status of the action */
          status: "error"
          /** The error thrown by the handler */
          error: TIsProcedure extends true
            ? unknown
            : TError extends TShapeErrorNotSet
              ? unknown
              : TError
        }
  ): any
}
