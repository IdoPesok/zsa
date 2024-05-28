/**
 * @jest-environment jsdom
 */
import { cookies } from "next/headers"
import {
  faultyAction,
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
  undefinedAction,
} from "server/actions"
import { RetryState, TEST_DATA } from "server/data"

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
      expect(data).toEqual("hello world")
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

      const [data, err] = await faultyAction()
      expect(data).toBeNull()
      expect(err?.code).toEqual(TEST_DATA.errors.notAuthorized)
    })

    it("returns an error when authenticated", async () => {
      ;(cookies as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue({ value: TEST_DATA.session.admin }),
      })

      const [data, err] = await faultyAction()
      expect(data).toBeNull()
      expect(err?.data).not.toEqual(TEST_DATA.errors.notAuthorized)
      expect(err?.data).toEqual(TEST_DATA.errors.string)
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
})
