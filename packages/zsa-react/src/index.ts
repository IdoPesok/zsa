"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import {
  TAnyRouterAction,
  TAnyZodSafeFunctionHandler,
  inferMapFromRouterAction,
  inferServerActionReturnType,
} from "zsa"
import { TSetOptimisticInput, evaluateOptimisticInput } from "./optimistic"
import { TUseServerActionOpts } from "./opts"
import {
  TInnerResult,
  TOldResult,
  TServerActionResult,
  calculateResultFromState,
  getEmptyOldResult,
  getEmptyResult,
} from "./results"
import { getRetryDelay } from "./retries"
import { mergePossibleObjects } from "./utils"

export const useServerAction = <
  const TServerAction extends TAnyZodSafeFunctionHandler,
  TPersistError extends boolean = false,
  TPersistData extends boolean = false,
  TUseRouterKey extends boolean = false,
>(
  serverAction: TServerAction,
  opts?: TUseServerActionOpts<
    TServerAction,
    TPersistError,
    TPersistData,
    TUseRouterKey
  >
) => {
  const initialData = opts?.initialData
  const bindArgs = opts?.bind

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
  const [isExecuting, setExecuting] = useState(false)

  const status = useRef<TServerActionResult<TServerAction>["status"]>("idle")

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
      overrideData?: Parameters<TServerAction>[1],
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

      status.current = "pending"
      setExecuting(true)

      let data, err

      const handleResponse = (response: any) => {
        // during a NEXT_REDIRECT exception, response will not be defined,
        // but technically the request was successful even though it threw an error.
        if (response) {
          ;[data, err] = response
        }
      }

      if (!opts?.routerKey) {
        await serverAction(input, overrideData).then(handleResponse)
      } else {
        // if we have a router key, pass it to the server action
        await serverAction(opts.routerKey, input, overrideData).then(
          handleResponse
        )
      }

      if (err) {
        let retryDelay = getRetryDelay(opts?.retry, retryCount.current, err)
        if (retryDelay >= 0) {
          // execute the retry logic
          retryCount.current += 1
          return await new Promise((resolve) =>
            setTimeout(() => {
              internalExecute(input, overrideData, {
                ...(args || {}),
                isFromRetryId: retryId,
              }).then(resolve)
            }, retryDelay)
          )
        }

        // don't retry => update the result
        if (oldResult.status === "filled") {
          setResult(oldResult.result)
        } else {
          setResult({
            error: err,
            data: undefined,
            status: "error",
          })
        }

        // clear the old data
        setOldResult({
          status: "empty",
          result: undefined,
        })

        // trigger error useEffect
        status.current = "error"
        setExecuting(false)

        return [data, err] as any
      }

      const res = {
        error: undefined,
        data: data ?? undefined,
        status: "success" as const,
      }

      setResult(res)

      // clear the old data
      setOldResult({
        status: "empty",
        result: undefined,
      })

      // success state
      status.current = "success"
      setExecuting(false)

      return [data, err] as any
    },
    [serverAction]
  )

  const execute = useCallback(
    async (
      ...opts: Parameters<TServerAction>[0] extends FormData
        ? [FormData] | [FormData, Parameters<TServerAction>[1]]
        : Parameters<TServerAction>[0] extends undefined
          ? []
          : [Parameters<TServerAction>[0]]
    ): Promise<inferServerActionReturnType<TServerAction>> => {
      return await new Promise((resolve) => {
        executeRef.current = resolve
        startTransition(() => {
          internalExecute(opts[0], mergePossibleObjects(bindArgs, opts[1]))
        })
      })
    },
    [internalExecute]
  )

  const executeFormAction = useCallback(
    async (
      ...opts: Parameters<TServerAction>[0] extends undefined
        ? []
        : [Parameters<TServerAction>[0]]
    ): Promise<null> => {
      return await new Promise((resolve) => {
        startTransition(() => {
          internalExecute(opts[0], bindArgs)
        })
        executeRef.current = resolve
        resolve(null)
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
        error: undefined,
        data: data ?? undefined,
        status: "success",
      })
    },
    [execute]
  )

  const reset = useCallback(() => {
    setResult(getEmptyResult())
    setOldResult(getEmptyOldResult())
    setExecuting(false)
    status.current = "idle"
    lastRetryId.current = 0
    retryCount.current = 0
  }, [])

  const isRunningCallbacks = useRef(false)

  const handleCallbacks = useCallback(() => {
    if (!executeRef.current || isRunningCallbacks.current) {
      return
    }

    // make sure we don't call this function multiple times
    isRunningCallbacks.current = true

    // handle the success state
    if (status.current === "success") {
      executeRef.current?.([resultRef.current.data, null])

      // call success callback
      opts?.onSuccess?.({
        data: resultRef.current.data as any,
      })

      // call finish callback
      opts?.onFinish?.([resultRef.current.data, null] as any)
    }

    // handle the error state
    if (status.current === "error") {
      executeRef.current?.([null, resultRef.current.error])

      // call error callback
      opts?.onError?.({
        err: resultRef.current.error as any,
      })

      // call finish callback
      opts?.onFinish?.([null, resultRef.current.error] as any)
    }

    // reset the states
    executeRef.current = undefined
    status.current = "idle"
    isRunningCallbacks.current = false
  }, [])

  // check if the status is pending
  // NOTE: during retries, the status is "pending" but the transition is not
  //       complete, so we need to check the status to see if it is pending
  const isPending = isTransitioning || isExecuting

  useEffect(() => {
    // we need this effect because we won't know when the next.js server action is
    // actually done until the transition finishes and sets isTransitioning back to false.
    // when the transition finishes, we call resolve the executeRef.current promise and also
    // invoke the onSuccess and onError callbacks.
    if (isPending) return

    // handle the callbacks
    handleCallbacks()
  }, [status.current, isPending])

  // on a revalidatePath or redirect the isPending useEffect won't run
  // to combat this, we need to have a cleanup method that will fire
  // when the hook is unmounted. we will run the callbacks here
  // since they won't be called from the useEffect
  useEffect(() => {
    return () => {
      if (executeRef.current !== undefined) {
        handleCallbacks()
      }
    }
  }, [])

  const final = calculateResultFromState<
    TServerAction,
    TPersistData,
    TPersistError
  >({
    isPending,
    oldResult,
    result: resultRef.current,
    persistDataWhilePending: opts?.persistDataWhilePending,
    persistErrorWhilePending: opts?.persistErrorWhilePending,
  })

  return {
    ...final,
    reset,
    execute,
    setOptimistic,
    executeFormAction,
  }
}

export const useRouterAction = <
  TRouter extends TAnyRouterAction,
  TServerActionKey extends keyof inferMapFromRouterAction<TRouter>,
  TPersistError extends boolean = false,
  TPersistData extends boolean = false,
>(
  router: TRouter,
  serverActionKey: TServerActionKey,
  opts?: TUseServerActionOpts<
    inferMapFromRouterAction<TRouter>[TServerActionKey],
    TPersistError,
    TPersistData,
    false
  >
) => {
  const hookData = useServerAction<
    inferMapFromRouterAction<TRouter>[TServerActionKey],
    TPersistError,
    TPersistData,
    true
  >(router as any, {
    ...(opts || {}),
    routerKey: serverActionKey as string,
  })

  return hookData
}
