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
  undefinedAction,
} from "server/actions"
import { TEST_DATA } from "server/data"

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
})
