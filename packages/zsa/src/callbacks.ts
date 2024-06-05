import z from "zod"

/** An error handler function */
export interface TOnErrorFn {
  (err: unknown): any
}

/** A start handler function */
export interface TOnStartFn<
  TInputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  (value: {
    /** The known args passed to the handler */
    args: TIsProcedure extends false ? TInputSchema["_input"] : unknown
  }): any
}

/** A success handler function */
export interface TOnSuccessFn<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
  TIsProcedure extends boolean,
> {
  (value: {
    /** The known args passed to the handler */
    args: TIsProcedure extends false ? TInputSchema["_output"] : unknown
    /** The successful data returned from the handler */
    data: TIsProcedure extends false ? TOutputSchema["_output"] : unknown
  }): any
}

/**
 * A complete handler function
 *
 * Runs after onSuccess or onError
 */
export interface TOnCompleteFn<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType,
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
          args: TIsProcedure extends false ? TInputSchema["_output"] : unknown
          /** The successful data returned from the handler */
          data: TIsProcedure extends false ? TOutputSchema["_output"] : unknown
        }
      | {
          /** A boolean indicating if the action was successful */
          isSuccess: false
          /** A boolean indicating if the action was an error */
          isError: true
          /** The status of the action */
          status: "error"
          /** The error thrown by the handler */
          error: unknown
        }
  ): any
}
