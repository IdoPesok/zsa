import { TAnyZodSafeFunctionHandler, inferServerActionError } from "zsa"

/**
 * A config object for retrying a server action on the client side
 */
export interface RetryConfig<TServerAction extends TAnyZodSafeFunctionHandler> {
  /** The maximum number of times to retry the action. Inclusive. */
  maxAttempts: number

  /**
   * The delay in milliseconds between retry attempts.
   *
   * Can either be a number (ms) or a function that takes the
   * current attempt number and the error as arguments and returns a number of ms.
   */
  delay?:
    | number
    | ((
        currentAttempt: number,
        err: inferServerActionError<TServerAction>
      ) => number)
}

/**
 *  Get the retry delay for the current retry attempt based on the retry config
 */
export const getRetryDelay = (
  retryConfig: RetryConfig<any> | undefined,
  retryCount: number,
  err: any
) => {
  const shouldRetry = retryConfig
    ? retryCount + 1 < retryConfig.maxAttempts
    : false

  let retryDelay = 0
  const retryDelayOpt = retryConfig?.delay
  if (retryDelayOpt && typeof retryDelayOpt === "function") {
    retryDelay = retryDelayOpt(retryCount + 1, err)
  } else if (retryDelayOpt && typeof retryDelayOpt === "number") {
    retryDelay = retryDelayOpt
  }

  if (!shouldRetry) return -1

  return retryDelay
}
