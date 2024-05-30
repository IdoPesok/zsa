import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  ZSAError,
  chainServerActionProcedures,
  createServerAction,
  createServerActionProcedure,
} from "zsa"
import { RetryState, TEST_DATA, auth, getPostById } from "./data"

/*
 * Public Action
 *
 * This action is public and can be called by anyone
 */

export const publicAction = createServerAction()

/**
 * Protected Action
 *
 * This action is protected by a session cookie
 */

const protectedProcedure = createServerActionProcedure().handler(
  async ({ request, responseMeta }) => {
    if (responseMeta) {
      responseMeta.headers.set("x-test", "123")
    }

    if (request) {
      const authToken = request.headers.get("authorization")
      if (authToken !== TEST_DATA.authorization.token) {
        throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
      }
      return {
        auth: TEST_DATA.user,
      }
    }

    return {
      auth: auth(),
    }
  }
)

export const protectedAction = protectedProcedure.createServerAction()

/**
 * Admin Action
 *
 * This action is protected by an admin session cookie
 */

const isAdminProcedure = createServerActionProcedure(
  protectedProcedure
).handler(async ({ ctx }) => {
  if (ctx.auth.id !== TEST_DATA.admin.id) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
  }

  return {
    auth: {
      ...ctx.auth,
      isAdmin: true as const,
    },
  }
})

export const adminAction = isAdminProcedure.createServerAction()

/**
 * Owns Post Action
 *
 * This action checks if the user owns the post being requested
 */

const ownsPostProcedure = createServerActionProcedure(protectedProcedure)
  .input(z.object({ postId: z.enum(["testUserAuthor", "notTestUserAuthor"]) }))
  .handler(async ({ ctx, input }) => {
    const post = getPostById(input.postId)

    if (!post || post.id === "notTestUserAuthor") {
      throw new ZSAError("NOT_AUTHORIZED", TEST_DATA.errors.doesNotOwnPost)
    }

    return {
      user: ctx.auth,
      post,
    }
  })

export const ownsPostAction = ownsPostProcedure.createServerAction()

/**
 * Owns Post Is Admin Action
 *
 * This action checks if the user owns the post being requested and is an admin
 */

const ownsPostIsAdminProcedure = chainServerActionProcedures(
  isAdminProcedure,
  ownsPostProcedure
)

export const ownsPostIsAdminAction =
  ownsPostIsAdminProcedure.createServerAction()

/**
 * Rate Limited Action
 *
 * This action is a dummy action that returns void contexts
 */

const rateLimitedProcedure = createServerActionProcedure(
  createServerActionProcedure().handler(async () => {
    return
  })
).handler(async () => {
  return
})

export const rateLimitedAction = rateLimitedProcedure.createServerAction()

/**
 * Timeout Action
 *
 * This action is has a timeout set
 */

const timeoutProcedure = createServerActionProcedure()
  .timeout(TEST_DATA.timeout)
  .handler(async () => {
    return
  })

export const timeoutAction = timeoutProcedure.createServerAction()

/**
 * Protected Timeout Action
 *
 * This action is protected by a session cookie and has a timeout set
 */

export const protectedTimeoutAction = chainServerActionProcedures(
  timeoutProcedure,
  protectedProcedure
).createServerAction()

/**
 * Retry Action
 *
 * This action has a retry mechanism set
 */

export const retryProcedure = createServerActionProcedure()
  .input(
    z.object({
      passOnAttempt: z.number(),
    })
  )
  .retry({
    maxAttempts: TEST_DATA.retries.maxAttempts,
    delay: TEST_DATA.retries.delay,
  })
  .handler(async ({ input }) => {
    const cookieStore = cookies()
    const retryState = cookieStore.get("")

    if (!retryState) {
      throw new ZSAError("ERROR", "No retry state found")
    }

    const parsed = JSON.parse(retryState.value) as RetryState

    if (parsed.id !== "retryCookie") {
      throw new ZSAError("ERROR", "Invalid retry state")
    }

    const newRetryState: RetryState = {
      id: "retryCookie",
      attemptNumber: parsed.attemptNumber + 1,
    }

    if (parsed.attemptNumber !== input.passOnAttempt) {
      cookieStore.set("", JSON.stringify(newRetryState))
      throw new ZSAError("ERROR", "forcing retry")
    }

    return "Success!"
  })

export const retryAction = retryProcedure.createServerAction()

/**
 * Retry Action
 *
 * This action has a retry mechanism set with exponential backoff
 */

export const exponentialRetryProcedure = createServerActionProcedure()
  .retry({
    maxAttempts: TEST_DATA.retries.maxAttempts,
    delay: (currentAttempt) =>
      TEST_DATA.retries.delay * Math.pow(2, currentAttempt),
  })
  .handler(async ({ input }) => {
    throw new ZSAError("ERROR", "forcing retry")
  })

export const exponentialRetryAction =
  exponentialRetryProcedure.createServerAction()

/**
 * Faulty Output
 *
 * This action has an output schema that will throw an error
 */

export const faultyOutputProcedure = createServerActionProcedure()
  .output(
    z.object({
      number: z.number().refine((n) => n > 0),
    })
  )
  .handler(async () => {
    return {
      number: 0,
    }
  })

/**
 * Input Number
 *
 * This action has an input schema that takes a number > 0
 */

export const inputNumberProcedure = createServerActionProcedure()
  .input(
    z.object({
      number: z.number().refine((n) => n > 0),
    })
  )
  .handler(async ({ input }) => {
    return {
      number: input.number,
    }
  })

export const redirectProcedure = createServerActionProcedure(
  // put in a parent procedure because why not
  createServerActionProcedure().handler(() => {
    return "123"
  })
).handler(async () => {
  redirect("/123")
  return "123"
})

export const redirectAction = redirectProcedure.createServerAction()
