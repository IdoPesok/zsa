"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import {
  TAnyZodSafeFunctionHandler,
  inferServerActionError,
  inferServerActionReturnData,
  inferServerActionReturnType,
} from "zsa"
import { TSetOptimisticInput, evaluateOptimisticInput } from "./optimistic"
import {
  TInnerResult,
  TOldResult,
  TServerActionResult,
  calculateResultFromState,
  getEmptyOldResult,
  getEmptyResult,
} from "./results"
import { RetryConfig, getRetryDelay } from "./retries"

export const useServerAction = <
  const TServerAction extends TAnyZodSafeFunctionHandler,
>(
  serverAction: TServerAction,
  opts?: {
    onError?: (args: { err: inferServerActionError<TServerAction> }) => void
    onSuccess?: (args: {
      data: inferServerActionReturnData<TServerAction>
    }) => void
    onStart?: () => void

    initialData?: inferServerActionReturnData<TServerAction>

    retry?: RetryConfig<TServerAction>
  }
) => {
  const initialData = opts?.initialData

  // store the result in state and a ref
  const [result, $setResult] = useState<TInnerResult<TServerAction>>(
    getEmptyResult(initialData)
  )
  const resultRef = useRef<TInnerResult<TServerAction>>(
    getEmptyResult(initialData)
  )

  // store the old result in state and a ref
  const [oldResult, $setOldResult] =
    useState<TOldResult<TServerAction>>(getEmptyOldResult())
  const oldResultRef = useRef<TOldResult<TServerAction>>(getEmptyOldResult())

  // store retry data
  const lastRetryId = useRef(0)
  const retryCount = useRef(0)

  // store the resolve function for execute
  const executeRef = useRef<any>()

  // keep track of pending states
  const [isTransitioning, startTransition] = useTransition()
  const [status, setStatus] =
    useState<TServerActionResult<TServerAction>["status"]>("idle")

  // set the result state and ref
  const setResult = useCallback((result: TInnerResult<TServerAction>) => {
    $setResult(result)
    resultRef.current = result
  }, [])

  // set the old result state and ref
  const setOldResult = useCallback((oldResult: TOldResult<TServerAction>) => {
    $setOldResult(oldResult)
    oldResultRef.current = oldResult
  }, [])

  const internalExecute = useCallback(
    async (
      input: Parameters<TServerAction>[0],
      args?: {
        isFromRetryId?: number
      }
    ) => {
      const { isFromRetryId } = args || {}

      // if the retry ids don't match, we should not refetch
      if (isFromRetryId && lastRetryId.current !== isFromRetryId) {
        return [
          null,
          {
            message: "Could not successfully execute the server action",
            data: "Could not successfully execute the server action",
            stack: "",
            name: "ZSAError",
            code: "ERROR",
          },
        ] as any
      }

      // start a new retry count
      if (!isFromRetryId) {
        retryCount.current = 0
      }

      // start a new retry id
      const retryId = Math.floor(Math.random() * 10000)
      lastRetryId.current = retryId

      if (opts?.onStart) opts.onStart()

      setStatus("pending")

      let data, err

      await serverAction(input).then((response) => {
        // during a NEXT_REDIRECT exception, response will not be defined,
        // but technically the request was successful even though it threw an error.
        if (response) {
          ;[data, err] = response
        }
      })

      if (err) {
        let retryDelay = getRetryDelay(opts?.retry, retryCount.current, err)
        if (retryDelay >= 0) {
          // execute the retry logic
          retryCount.current += 1
          return await new Promise((resolve) =>
            setTimeout(() => {
              internalExecute(input, {
                ...(args || {}),
                isFromRetryId: retryId,
              }).then(resolve)
            }, retryDelay)
          )
        }

        setStatus("error")

        // don't retry => update the result
        if (oldResult.status === "filled") {
          setResult(oldResult.result)
        } else {
          setResult({ error: err, isError: true, data: undefined })
        }

        // clear the old data
        setOldResult({
          status: "empty",
          result: undefined,
        })

        return [data, err] as any
      }

      // success state
      setStatus("success")

      const res = {
        isError: false,
        error: undefined,
        data: data ?? undefined,
      }

      setResult(res)

      // clear the old data
      setOldResult({
        status: "empty",
        result: undefined,
      })

      return [data, err] as any
    },
    [serverAction]
  )

  const execute = useCallback(
    async (
      ...opts: Parameters<TServerAction>[0] extends undefined
        ? []
        : [Parameters<TServerAction>[0]]
    ): Promise<inferServerActionReturnType<TServerAction>> => {
      return await new Promise((resolve) => {
        executeRef.current = resolve
        startTransition(() => {
          internalExecute(opts[0])
        })
      })
    },
    [internalExecute]
  )

  const setOptimistic = useCallback(
    async (fn: TSetOptimisticInput<TServerAction>) => {
      const data = evaluateOptimisticInput(
        fn,
        oldResultRef.current,
        resultRef.current
      )

      if (oldResult.status === "empty") {
        setOldResult({
          status: "filled",
          result: { ...result },
        })
      }

      setResult({
        isError: false,
        error: undefined,
        data: data ?? undefined,
      })
    },
    [execute]
  )

  const reset = useCallback(() => {
    setResult(getEmptyResult())
    setOldResult(getEmptyOldResult())
    setStatus("idle")
    lastRetryId.current = 0
    retryCount.current = 0
  }, [])

  // check if the status is pending
  // NOTE: during retries, the status is "pending" but the transition is not
  //       complete, so we need to check the status to see if it is pending
  const isPending = isTransitioning || status === "pending"

  useEffect(() => {
    // we need this effect because we won't know when the next.js server action is
    // actually done until the transition finishes and sets isTransitioning back to false.
    // when the transition finishes, we call resolve the executeRef.current promise and also
    // invoke the onSuccess and onError callbacks.
    if (isPending) return

    // handle the success state
    if (status === "success") {
      executeRef.current?.([resultRef.current.data, null])
      if (opts?.onSuccess) {
        opts.onSuccess({
          data: resultRef.current.data as any,
        })
      }
    }

    // handle the error state
    if (status === "error") {
      executeRef.current?.([null, resultRef.current.error])
      if (opts?.onError) {
        opts.onError({
          err: resultRef.current.error as any,
        })
      }
    }
  }, [status, isPending])

  const final = calculateResultFromState<TServerAction>({
    isPending,
    oldResult,
    result: resultRef.current,
  })

  return {
    ...final,
    reset,
    execute,
    setOptimistic,
  }
}
