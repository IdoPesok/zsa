import { evaluateOptimisticInput } from "../../../packages/zsa-react/src/optimistic"
import {
  calculateResultFromState,
  getEmptyOldResult,
  getEmptyResult,
} from "../../../packages/zsa-react/src/results"
import { getRetryDelay } from "../../../packages/zsa-react/src/retries"
import { mergePossibleObjects } from "../../../packages/zsa-react/src/utils"

describe("zsa-react/src/utils - mergePossibleObjects", () => {
  it("returns undefined when both arguments are undefined", () => {
    expect(mergePossibleObjects(undefined, undefined)).toBeUndefined()
  })

  it("returns the defined argument when the other is undefined", () => {
    expect(mergePossibleObjects({ a: 1 }, undefined)).toEqual({ a: 1 })
    expect(mergePossibleObjects(undefined, { b: 2 })).toEqual({ b: 2 })
  })

  it("returns the second argument when either input is not an object", () => {
    expect(mergePossibleObjects(1, { a: 1 })).toEqual({ a: 1 })
    expect(mergePossibleObjects({ a: 1 }, 2)).toBe(2)
    expect(mergePossibleObjects("foo", "bar")).toBe("bar")
  })

  it("merges two objects, with the second taking precedence on conflicts", () => {
    expect(mergePossibleObjects({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({
      a: 1,
      b: 3,
      c: 4,
    })
  })
})

describe("zsa-react/src/retries - getRetryDelay", () => {
  it("returns -1 when no retry config is provided", () => {
    expect(getRetryDelay(undefined, 0, new Error())).toBe(-1)
  })

  it("returns -1 when max attempts have been reached", () => {
    const config = { maxAttempts: 2 }
    // retryCount is 0-indexed; after 1 retry we've used both attempts
    expect(getRetryDelay(config, 1, new Error())).toBe(-1)
  })

  it("returns 0 delay when delay is not configured", () => {
    const config = { maxAttempts: 3 }
    expect(getRetryDelay(config, 0, new Error())).toBe(0)
  })

  it("returns the configured numeric delay", () => {
    const config = { maxAttempts: 3, delay: 150 }
    expect(getRetryDelay(config, 0, new Error())).toBe(150)
  })

  it("invokes the configured delay function with attempt number and error", () => {
    const delay = jest.fn().mockReturnValue(42)
    const config = { maxAttempts: 3, delay }
    const err = new Error("boom")

    expect(getRetryDelay(config, 1, err)).toBe(42)
    expect(delay).toHaveBeenCalledWith(2, err)
  })
})

describe("zsa-react/src/optimistic - evaluateOptimisticInput", () => {
  const filledResult = {
    status: "filled" as const,
    result: {
      status: "success" as const,
      error: undefined,
      data: { count: 10 },
    },
  }
  const emptyResult = { status: "empty" as const, result: undefined }
  const currentInner = {
    status: "success" as const,
    error: undefined,
    data: { count: 5 },
  }

  it("returns the static value when fn is not a function", () => {
    expect(
      evaluateOptimisticInput({ count: 99 } as any, filledResult, currentInner)
    ).toEqual({ count: 99 })
  })

  it("calls fn with data from the old result when old is filled", () => {
    const fn = jest.fn((current: any) => ({ count: current.count + 1 }))
    expect(evaluateOptimisticInput(fn, filledResult, currentInner)).toEqual({
      count: 11,
    })
    expect(fn).toHaveBeenCalledWith({ count: 10 })
  })

  it("calls fn with the current result's data when old result is empty", () => {
    const fn = jest.fn((current: any) => ({ count: current.count + 1 }))
    expect(evaluateOptimisticInput(fn, emptyResult, currentInner)).toEqual({
      count: 6,
    })
    expect(fn).toHaveBeenCalledWith({ count: 5 })
  })
})

describe("zsa-react/src/results", () => {
  describe("getEmptyResult", () => {
    it("returns idle state when no initial data is provided", () => {
      expect(getEmptyResult()).toEqual({
        status: "idle",
        error: undefined,
        data: undefined,
      })
    })

    it("returns a success state when initial data is provided", () => {
      expect(getEmptyResult({ hello: "world" } as any)).toEqual({
        status: "success",
        error: undefined,
        data: { hello: "world" },
      })
    })
  })

  describe("getEmptyOldResult", () => {
    it("returns an empty old result", () => {
      expect(getEmptyOldResult()).toEqual({
        status: "empty",
        result: undefined,
      })
    })
  })

  describe("calculateResultFromState", () => {
    const idleResult = {
      status: "idle" as const,
      error: undefined,
      data: undefined,
    }
    const successResult = {
      status: "success" as const,
      error: undefined,
      data: { id: 1 },
    }
    const errorResult = {
      status: "error" as const,
      error: new Error("nope"),
      data: undefined,
    }
    const emptyOld = getEmptyOldResult()

    it("returns idle state when not pending and the result is idle", () => {
      const state = {
        isPending: false,
        oldResult: emptyOld,
        result: idleResult,
      }
      expect(calculateResultFromState(state)).toEqual({
        isPending: false,
        data: undefined,
        isOptimistic: false,
        isError: false,
        error: undefined,
        isSuccess: false,
        status: "idle",
      })
    })

    it("returns pending state (non-optimistic) when pending with empty old result", () => {
      const state = {
        isPending: true,
        oldResult: emptyOld,
        result: idleResult,
      }
      const out = calculateResultFromState(state)
      expect(out).toMatchObject({
        isPending: true,
        isOptimistic: false,
        isSuccess: false,
        isError: false,
        status: "pending",
        data: undefined,
        error: undefined,
      })
    })

    it("persists data while pending when persistDataWhilePending is true", () => {
      const state = {
        isPending: true,
        oldResult: emptyOld,
        result: successResult,
        persistDataWhilePending: true as const,
      }
      const out = calculateResultFromState(state)
      expect(out.data).toEqual({ id: 1 })
      expect(out.isPending).toBe(true)
      expect(out.isOptimistic).toBe(false)
    })

    it("persists error while pending when persistErrorWhilePending is true", () => {
      const state = {
        isPending: true,
        oldResult: emptyOld,
        result: errorResult,
        persistErrorWhilePending: true as const,
      }
      const out = calculateResultFromState(state)
      expect(out.error).toBe(errorResult.error)
      expect(out.isPending).toBe(true)
    })

    it("returns optimistic pending state when pending with a filled old result and a success result", () => {
      const state = {
        isPending: true,
        oldResult: {
          status: "filled" as const,
          result: { status: "success" as const, error: undefined, data: 1 },
        },
        result: successResult,
      }
      const out = calculateResultFromState(state)
      expect(out).toMatchObject({
        isPending: true,
        isOptimistic: true,
        isSuccess: false,
        isError: false,
        status: "pending",
        data: { id: 1 },
        error: undefined,
      })
    })

    it("returns success state when the result is success and not pending", () => {
      const state = {
        isPending: false,
        oldResult: emptyOld,
        result: successResult,
      }
      expect(calculateResultFromState(state)).toEqual({
        isPending: false,
        isOptimistic: false,
        isSuccess: true,
        isError: false,
        status: "success",
        data: { id: 1 },
        error: undefined,
      })
    })

    it("returns error state when the result is an error and not pending", () => {
      const state = {
        isPending: false,
        oldResult: emptyOld,
        result: errorResult,
      }
      expect(calculateResultFromState(state)).toEqual({
        isPending: false,
        isOptimistic: false,
        isSuccess: false,
        isError: true,
        status: "error",
        data: undefined,
        error: errorResult.error,
      })
    })
  })
})
