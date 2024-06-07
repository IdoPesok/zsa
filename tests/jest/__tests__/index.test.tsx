/**
 * @jest-environment jsdom
 */
import { cookies } from "next/headers"
import {
  emptyFormDataAction,
  faultyAction,
  faultyOutputAction,
  faultyOutputInProcedureAction,
  formDataAction,
  getAdminGreetingAction,
  getPostByIdAction,
  getPostByIdIsAdminAction,
  getUserGreetingAction,
  getUserIdAction,
  helloWorldAction,
  helloWorldExponentialRetryAction,
  helloWorldProcedureTimeoutAction,
  helloWorldProtectedTimeoutAction,
  helloWorldRetryAction,
  helloWorldRetryProcedureAction,
  helloWorldTimeoutAction,
  inputLargeNumberAction,
  inputNumberAction,
  intersectedInputAction,
  multiEntryFormDataAction,
  nextNotFoundAction,
  nextRedirectAction,
  nextRedirectInProcedureAction,
  procedureChainAuthAction,
  procedureChainAuthActionWithCounter,
  stateInputAction,
  stateInputProcedureAction,
  transformedOutputAction,
  undefinedAction,
} from "server/actions"
import { RetryState, TEST_DATA } from "server/data"
import { z } from "zod"
import { createServerActionProcedure } from "zsa"

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

describe("actions", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe("helloWorldAction", () => {
    it('returns "hello world"', async () => {
      const [data, err] = await helloWorldAction()
      const testType: typeof data = "hello world"
      expect(data).toEqual("hello world")
      expect(testType).toEqual("hello world")
      expect(err).toBeNull()
    })
  })

  describe("getUserIdAction", () => {
    it("returns the user ID when authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      const [data, err] = await getUserIdAction()
      expect(data).toEqual(TEST_DATA.user.id)
      expect(err).toBeNull()
    })

    it("returns an error when not authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: (v: string) => null,
      })

      const [data, err] = await getUserIdAction()
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
      expect((err as any)?.stack).not.toBeDefined()
    })
  })

  describe("getUserGreetingAction", () => {
    it("returns a greeting with the user name when authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      const [data, err] = await getUserGreetingAction()
      expect(data).toEqual(`Hello, ${TEST_DATA.user.name}!`)
      expect(err).toBeNull()
    })

    it("returns an error when not authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      })

      const [data, err] = await getUserGreetingAction()
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
    })
  })

  describe("getAdminGreetingAction", () => {
    it("returns a greeting with the admin name when authenticated as admin", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const [data, err] = await getAdminGreetingAction()
      expect(data).toEqual(`Hello, ${TEST_DATA.admin.name}!`)
      expect(err).toBeNull()
    })

    it("returns an error when not authenticated as admin", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      const [data, err] = await getAdminGreetingAction()
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
    })
  })

  describe("getPostByIdAction", () => {
    it("returns the post when authenticated and owns the post", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      const [data, err] = await getPostByIdAction({ postId: "testUserAuthor" })
      expect(data?.id).toEqual("testUserAuthor")
      expect(err).toBeNull()
    })

    it("returns an error when not authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      })

      const [data, err] = await getPostByIdAction({ postId: "testUserAuthor" })
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
    })

    it("returns an error when authenticated but does not own the post", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      const [data, err] = await getPostByIdAction({
        postId: "notTestUserAuthor",
      })
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toEqual(TEST_DATA.errors.doesNotOwnPost)
    })
  })

  describe("getPostByIdIsAdminAction", () => {
    it("returns the post when authenticated as admin and owns the post", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const [data, err] = await getPostByIdIsAdminAction({
        postId: "testUserAuthor",
      })
      expect(data?.id).toEqual("testUserAuthor")
      expect(err).toBeNull()
    })

    it("returns an error when not authenticated as admin", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: "session" }),
      })

      const [data, err] = await getPostByIdIsAdminAction({
        postId: "testUserAuthor",
      })
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
    })

    it("returns an error when authenticated as admin but does not own the post", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const [data, err] = await getPostByIdIsAdminAction({
        postId: "notTestUserAuthor",
      })
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toEqual(TEST_DATA.errors.doesNotOwnPost)
    })
  })

  describe("faultyAction", () => {
    it("returns an error when not authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: () => null,
      })

      const [data, err] = await faultyAction({
        errorType: "string",
      })
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
    })

    it("returns an error when authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const [data, err] = await faultyAction({
        errorType: "string",
      })
      expect(data).toBeNull()
      expect(err?.code).not.toEqual(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toEqual(TEST_DATA.errors.string)
      expect(err?.message).toEqual(TEST_DATA.errors.string)
    })

    it("returns an error when input is a class", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const [data, err] = await faultyAction({
        errorType: "class",
      })
      expect(data).toBeNull()
      expect(err?.code).not.toEqual(TEST_DATA.errors.notAuthorized)
      expect(err?.message).toEqual(TEST_DATA.errors.string)
    })
  })

  describe("undefinedAction", () => {
    it("returns undefined", async () => {
      const [data, err] = await undefinedAction()
      expect(data).toBeUndefined()
      expect(err).toBeNull()
    })
  })

  describe("retries", () => {
    let state: RetryState

    beforeEach(() => {
      state = {
        id: "retryCookie",
        attemptNumber: 1,
      }
      ;(cookies as jest.Mock).mockReturnValue({
        get: (v: string) => ({
          value: JSON.stringify(state),
        }),
        set: (k: string, v: string) => {
          state = JSON.parse(v)
        },
      })
    })

    it("returns a retry error", async () => {
      const [data, err] = await helloWorldRetryAction()
      expect(data).toBeNull()
      expect(err).not.toBeNull()
    })

    it("returns a retry error with exponential delay", async () => {
      const start = Date.now()
      const [data, err] = await helloWorldExponentialRetryAction()
      const end = Date.now()

      let expectedDelay = 0
      for (let i = 0; i < TEST_DATA.retries.maxAttempts - 1; i++) {
        expectedDelay += TEST_DATA.retries.delay * Math.pow(2, i)
      }

      expect(data).toBeNull()
      expect(err).not.toBeNull()
      expect(end - start).toBeGreaterThanOrEqual(expectedDelay)
      expect(end - start).toBeLessThanOrEqual(expectedDelay + 50)
    })

    it("returns a retry error from the procedure", async () => {
      const start = Date.now()
      const [data, err] = await helloWorldRetryProcedureAction({
        passOnAttempt: 100000,
      })
      const end = Date.now()

      expect(data).toBeNull()
      expect(err).not.toBeNull()
      expect(state.attemptNumber).toEqual(TEST_DATA.retries.maxAttempts + 1)

      expect(end - start).toBeGreaterThanOrEqual(
        TEST_DATA.retries.delay * (TEST_DATA.retries.maxAttempts - 1)
      )
      expect(end - start).toBeLessThanOrEqual(
        TEST_DATA.retries.delay * (TEST_DATA.retries.maxAttempts - 1) + 50
      )
    })

    it("does not return a retry error after 2 attempts from the procedure", async () => {
      const [data, err] = await helloWorldRetryProcedureAction({
        passOnAttempt: TEST_DATA.retries.maxAttempts - 1,
      })

      expect(err).toBeNull()
      expect(data).not.toBeNull()
      expect(state.attemptNumber).toEqual(TEST_DATA.retries.maxAttempts - 1)
    })
  })

  describe("timeout", () => {
    it("returns timeout error", async () => {
      const start = Date.now()
      const [data, err] = await helloWorldTimeoutAction()
      const end = Date.now()

      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.timeout)
      expect(end - start).toBeGreaterThanOrEqual(TEST_DATA.timeout)
      expect(end - start).toBeLessThanOrEqual(TEST_DATA.timeout + 50)
    })

    it("returns timeout error for procedure", async () => {
      const start = Date.now()
      const [data, err] = await helloWorldProcedureTimeoutAction()
      const end = Date.now()

      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.timeout)
      expect(end - start).toBeGreaterThanOrEqual(TEST_DATA.timeout)
      expect(end - start).toBeLessThanOrEqual(TEST_DATA.timeout + 50)
    })

    it("returns timeout error for protected action", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const start = Date.now()
      const [data, err] = await helloWorldProtectedTimeoutAction()
      const end = Date.now()

      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.timeout)
      expect(end - start).toBeGreaterThanOrEqual(TEST_DATA.timeout)
      expect(end - start).toBeLessThanOrEqual(TEST_DATA.timeout + 50)
    })
  })

  describe("output", () => {
    it("returns the transformed output", async () => {
      const [data, err] = await transformedOutputAction()
      expect(data).toEqual({ number: 100 })
      expect(err).toBeNull()
    })

    it("throws when the output in the procedure is invalid", async () => {
      const [data, err] = await faultyOutputInProcedureAction()
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.outputParse)
    })

    it("throws when the output in the action is invalid", async () => {
      const [data, err] = await faultyOutputAction()
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.outputParse)
    })
  })

  describe("input", () => {
    it("returns the input number", async () => {
      const [data, err] = await inputNumberAction({ number: 100 })
      expect(data).toEqual({ number: 100 })
      expect(err).toBeNull()
    })

    it("throws when the input number is invalid", async () => {
      const [data, err] = await inputNumberAction({ number: 0 })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.inputParse)
      expect(err?.fieldErrors?.number).not.toBeUndefined()
      expect(err?.formattedErrors?.number?._errors).not.toBeUndefined()
      expect(err?.formErrors).toHaveLength(0)
    })

    it("throws when the input number is not large", async () => {
      const [data, err] = await inputLargeNumberAction({ number: 100 })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.inputParse)
      expect(err?.fieldErrors?.number).not.toBeUndefined()
      expect(err?.formattedErrors?.number?._errors).not.toBeUndefined()
      expect(err?.formErrors).toHaveLength(0)
    })

    it("returns the input large number", async () => {
      const [data, err] = await inputLargeNumberAction({ number: 200 })
      expect(data).toEqual({ number: 200 })
      expect(err).toBeNull()
    })

    it("throws when the input is invalid", async () => {
      let [data, err] = await inputNumberAction({ notValid: 0 } as any)
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.inputParse)
      ;[data, err] = await inputLargeNumberAction({ notValid: 0 } as any)
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.inputParse)
      expect(err?.fieldErrors?.number).not.toBeUndefined()
      expect(err?.formattedErrors?.number?._errors).not.toBeUndefined()
      expect(err?.formErrors).toHaveLength(0)
    })
  })

  describe("next redirect", () => {
    it("throws the redirect error", async () => {
      await expect(nextRedirectAction()).rejects.toThrow("NEXT_REDIRECT")
    })
    it("throws the not found error", async () => {
      await expect(nextNotFoundAction()).rejects.toThrow("NEXT_NOT_FOUND")
    })
    it("throws the redirect error from the procedure", async () => {
      await expect(nextRedirectInProcedureAction()).rejects.toThrow(
        "NEXT_REDIRECT"
      )
    })
  })

  describe("form data", () => {
    it("returns the form data", async () => {
      const formData = new FormData()
      formData.append("name", "test")
      formData.append("email", "test@example.com")
      formData.append("number", "100")
      const [data, err] = await formDataAction(formData, {
        email: "test@example123.com",
      })

      expect(data).toEqual({
        name: "test",
        email: "test@example123.com",
        number: 100,
      })
      expect(err).toBeNull()
    })

    it("returns an input parse error", async () => {
      const formData = new FormData()
      formData.append("name", "test")
      formData.append("email", "test@example.com")
      formData.append("number", "not a number")
      const [data, err] = await formDataAction(formData)

      expect(data).toBeNull()
      expect(err).not.toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.inputParse)
    })

    it("returns a single element array", async () => {
      const formData = new FormData()
      formData.append("name", "test")
      const [data, err] = await multiEntryFormDataAction(formData)

      expect(data).toEqual(["test"])
      expect(err).toBeNull()
    })

    it("returns a multi element array", async () => {
      const formData = new FormData()
      formData.append("name", "test")
      formData.append("name", "test2")
      const [data, err] = await multiEntryFormDataAction(formData)

      expect(data).toEqual(["test", "test2"])
      expect(err).toBeNull()
    })

    it("returns the default input schema", async () => {
      const formData = new FormData()
      const [data, err] = await emptyFormDataAction(formData)

      expect(data).toEqual("hello world")
      expect(err).toBeNull()
    })

    it("returns an input schema error with default input schema", async () => {
      const formData = new FormData()
      formData.append("wrong input", "hello world")
      const [data, err] = await emptyFormDataAction(formData)

      expect(data).toBeNull()
      expect(err).not.toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.inputParse)
    })
  })

  describe("state input", () => {
    it("returns the previous state", async () => {
      const formData = new FormData()
      formData.append("number", "5")
      // test without previous state
      let [data, err] = await stateInputAction([null, null], formData)
      expect(data).toEqual(5)
      expect(err).toBeNull()
      // test with previous state
      ;[data, err] = await stateInputAction([data, err], formData)
      expect(data).toEqual(10)
      expect(err).toBeNull()
    })

    it("makes sure procedures have access to the previous state", async () => {
      // test without previous state
      let [data, err] = await stateInputProcedureAction(
        [null, null],
        new FormData()
      )
      expect(data).toEqual(2)
      expect(err).toBeNull()
      // test with previous state
      ;[data, err] = await stateInputProcedureAction(
        [data, err],
        new FormData()
      )
      expect(data).toEqual(4)
      expect(err).toBeNull()
    })
  })

  describe("procedure chain", () => {
    let state: string = "zero"
    beforeEach(() => {
      state = "zero"
      ;(cookies as jest.Mock).mockReturnValue({
        set: (k: string, v: string) => {
          state = v
        },
      })
    })

    it("should return the correct result after intersecting input", async () => {
      const [data, err] = await intersectedInputAction({
        a: "a",
        b: "b",
        c: "c",
      })
      expect(data).toEqual({
        input: {
          a: "a",
          b: "b",
          c: "c",
        },
        ctx: 3,
      })
      expect(err).toBeNull()
    })

    it("should throw an error if the first procedure is invalid [no counter]", async () => {
      let [data, err] = await procedureChainAuthAction({
        one: "invalid",
        two: "valid",
        three: "valid",
      })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toBe("one")
      expect(state).toBe("zero")
    })

    it("should throw an error if the first procedure is invalid [with counter]", async () => {
      let [data, err] = await procedureChainAuthActionWithCounter({
        one: "invalid",
        two: "valid",
        three: "valid",
      })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toBe("one")
      expect(state).toBe("zero")
    })

    it("should throw an error if the second procedure is invalid [no counter]", async () => {
      const [data, err] = await procedureChainAuthAction({
        one: "valid",
        two: "invalid",
        three: "valid",
      })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toBe("two")
      expect(state).toBe("one")
    })

    it("should throw an error if the second procedure is invalid [with counter]", async () => {
      let [data, err] = await procedureChainAuthActionWithCounter({
        one: "valid",
        two: "invalid",
        three: "valid",
      })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toBe("two")
      expect(state).toBe("one")
    })

    it("should throw an error if the third procedure is invalid [no counter]", async () => {
      const [data, err] = await procedureChainAuthAction({
        one: "valid",
        two: "valid",
        three: "invalid",
      })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toBe("three")
      expect(state).toBe("two")
    })

    it("should throw an error if the third procedure is invalid [with counter]", async () => {
      let [data, err] = await procedureChainAuthActionWithCounter({
        one: "valid",
        two: "valid",
        three: "invalid",
      })
      expect(data).toBeNull()
      expect(err?.code).toBe(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toBe("three")
      expect(state).toBe("two")
    })

    it("should not throw an error if all procedures are valid [no counter]", async () => {
      const [data, err] = await procedureChainAuthAction({
        one: "valid",
        two: "valid",
        three: "valid",
      })
      expect(data).toBeUndefined()
      expect(err).toBeNull()
      expect(state).toBe("three")
    })

    it("should not throw an error if all procedures are valid [with counter]", async () => {
      let [data, err] = await procedureChainAuthActionWithCounter({
        one: "valid",
        two: "valid",
        three: "valid",
      })
      expect(data).toEqual({
        counter: 3,
      })
      expect(err).toBeNull()
      expect(state).toBe("three")
    })
  })

  describe("callbacks", () => {
    let onStartMockA: jest.Mock
    let onStartMockB: jest.Mock
    let onStartMockC: jest.Mock

    let onSuccessMockA: jest.Mock
    let onSuccessMockB: jest.Mock
    let onSuccessMockC: jest.Mock

    let onCompleteMockA: jest.Mock
    let onCompleteMockB: jest.Mock
    let onCompleteMockC: jest.Mock

    let onErrorMockA: jest.Mock
    let onErrorMockB: jest.Mock
    let onErrorMockC: jest.Mock

    let onInputParseErrorMock: jest.Mock
    let onOutputParseErrorMock: jest.Mock

    let testCallbacksAction: any

    beforeEach(() => {
      onStartMockA = jest.fn()
      onStartMockB = jest.fn()
      onStartMockC = jest.fn()

      onSuccessMockA = jest.fn()
      onSuccessMockB = jest.fn()
      onSuccessMockC = jest.fn()

      onCompleteMockA = jest.fn()
      onCompleteMockB = jest.fn()
      onCompleteMockC = jest.fn()

      onErrorMockA = jest.fn()
      onErrorMockB = jest.fn()
      onErrorMockC = jest.fn()

      onInputParseErrorMock = jest.fn()
      onOutputParseErrorMock = jest.fn()

      // create a chained procedure with all callbacks set
      testCallbacksAction = createServerActionProcedure(
        createServerActionProcedure()
          .onStart(onStartMockA)
          .onSuccess(onSuccessMockA)
          .onComplete(onCompleteMockA)
          .onError(onErrorMockA)
          .handler(() => {})
      )
        .onStart(onStartMockB)
        .onSuccess(onSuccessMockB)
        .onComplete(onCompleteMockB)
        .onError(onErrorMockB)
        .handler(() => {})
        .createServerAction()
        .input(
          z.object({
            shouldError: z.boolean(),
            shouldOutputError: z.boolean().optional(),
          })
        )
        .onStart(onStartMockC)
        .onSuccess(onSuccessMockC)
        .onComplete(onCompleteMockC)
        .onError(onErrorMockC)
        .onInputParseError(onInputParseErrorMock)
        .output(z.string())
        .onOutputParseError(onOutputParseErrorMock)
        .handler(async ({ input }) => {
          if (input.shouldError) {
            throw new Error("Test error")
          }
          if (input.shouldOutputError) {
            return { wrongOutput: true } as any
          }
          return "Test success"
        })
    })

    it("executes onStart, onSuccess, and onComplete callbacks on success", async () => {
      const [data, err] = await testCallbacksAction({ shouldError: false })
      expect(data).toEqual("Test success")
      expect(err).toBeNull()

      for (const onStartMock of [onStartMockA, onStartMockB, onStartMockC]) {
        expect(onStartMock).toHaveBeenCalledWith({
          args: { shouldError: false },
        })
      }

      for (const onSuccessMock of [
        onSuccessMockA,
        onSuccessMockB,
        onSuccessMockC,
      ]) {
        expect(onSuccessMock).toHaveBeenCalledWith({
          args: { shouldError: false },
          data: "Test success",
        })
      }

      for (const onCompleteMock of [
        onCompleteMockA,
        onCompleteMockB,
        onCompleteMockC,
      ]) {
        expect(onCompleteMock).toHaveBeenCalledWith({
          isSuccess: true,
          isError: false,
          status: "success",
          args: { shouldError: false },
          data: "Test success",
        })
      }

      for (const onErrorMock of [onErrorMockA, onErrorMockB, onErrorMockC]) {
        expect(onErrorMock).not.toHaveBeenCalled()
      }

      expect(onInputParseErrorMock).not.toHaveBeenCalled()
      expect(onOutputParseErrorMock).not.toHaveBeenCalled()
    })

    it("executes onStart, onError, and onComplete callbacks on error", async () => {
      const [data, err] = await testCallbacksAction({ shouldError: true })
      expect(data).toBeNull()
      expect(err).not.toBeNull()

      for (const onStartMock of [onStartMockA, onStartMockB, onStartMockC]) {
        expect(onStartMock).toHaveBeenCalledWith({
          args: { shouldError: true },
        })
      }

      for (const onSuccessMock of [
        onSuccessMockA,
        onSuccessMockB,
        onSuccessMockC,
      ]) {
        expect(onSuccessMock).not.toHaveBeenCalled()
      }

      for (const onCompleteMock of [
        onCompleteMockA,
        onCompleteMockB,
        onCompleteMockC,
      ]) {
        expect(onCompleteMock).toHaveBeenCalled()
      }

      for (const onErrorMock of [onErrorMockA, onErrorMockB, onErrorMockC]) {
        expect(onErrorMock).toHaveBeenCalled()
      }

      expect(onInputParseErrorMock).not.toHaveBeenCalled()
      expect(onOutputParseErrorMock).not.toHaveBeenCalled()
    })

    it("executes onStart, onInputParseError, and onComplete callbacks on input parse error", async () => {
      const [data, err] = await testCallbacksAction({
        shouldError: "invalid",
      } as any)

      expect(data).toBeNull()
      expect(err).not.toBeNull()

      for (const onStartMock of [onStartMockA, onStartMockB, onStartMockC]) {
        expect(onStartMock).toHaveBeenCalledWith({
          args: { shouldError: "invalid" },
        })
      }

      for (const onSuccessMock of [
        onSuccessMockA,
        onSuccessMockB,
        onSuccessMockC,
      ]) {
        expect(onSuccessMock).not.toHaveBeenCalled()
      }

      for (const onCompleteMock of [
        onCompleteMockA,
        onCompleteMockB,
        onCompleteMockC,
      ]) {
        expect(onCompleteMock).toHaveBeenCalled()
      }

      for (const onErrorMock of [onErrorMockA, onErrorMockB, onErrorMockC]) {
        expect(onErrorMock).toHaveBeenCalled()
      }

      expect(onInputParseErrorMock).toHaveBeenCalled()
      expect(onOutputParseErrorMock).not.toHaveBeenCalled()
    })

    it("executes onStart, onSuccess, and onComplete callbacks on output parse error", async () => {
      const [data, err] = await testCallbacksAction({
        shouldError: false,
        shouldOutputError: true,
      })
      expect(data).toBeNull()
      expect(err).not.toBeNull()

      for (const onStartMock of [onStartMockA, onStartMockB, onStartMockC]) {
        expect(onStartMock).toHaveBeenCalledWith({
          args: { shouldOutputError: true, shouldError: false },
        })
      }

      for (const onSuccessMock of [
        onSuccessMockA,
        onSuccessMockB,
        onSuccessMockC,
      ]) {
        expect(onSuccessMock).not.toHaveBeenCalled()
      }

      for (const onCompleteMock of [
        onCompleteMockA,
        onCompleteMockB,
        onCompleteMockC,
      ]) {
        expect(onCompleteMock).toHaveBeenCalled()
      }

      for (const onErrorMock of [onErrorMockA, onErrorMockB, onErrorMockC]) {
        expect(onErrorMock).toHaveBeenCalled()
      }

      expect(onInputParseErrorMock).not.toHaveBeenCalled()
      expect(onOutputParseErrorMock).toHaveBeenCalled()
    })
  })
})
