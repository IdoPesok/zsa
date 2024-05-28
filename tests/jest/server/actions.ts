"use server"

import { sleep } from "lib/utils"
import { createServerAction } from "zsa"
import { TEST_DATA } from "./data"
import {
  adminAction,
  ownsPostAction,
  ownsPostIsAdminAction,
  protectedAction,
  protectedTimeoutAction,
  publicAction,
  rateLimitedAction,
  retryAction,
  timeoutAction,
} from "./procedures"

export const helloWorldAction = publicAction.handler(async () => {
  return "hello world" as const
})

export const getUserIdAction = protectedAction.handler(async ({ ctx }) => {
  return ctx.auth.id
})

export const getUserGreetingAction = protectedAction.handler(
  async ({ ctx }) => {
    return `Hello, ${ctx.auth.name}!` as const
  }
)

export const getAdminGreetingAction = adminAction.handler(async ({ ctx }) => {
  return `Hello, ${ctx.auth.name}!` as const
})

export const getPostByIdAction = ownsPostAction.handler(async ({ ctx }) => {
  return ctx.post
})

export const getPostByIdIsAdminAction = ownsPostIsAdminAction.handler(
  async ({ ctx }) => {
    return ctx.post
  }
)

export const faultyAction = protectedAction.handler(async () => {
  throw TEST_DATA.errors.string
})

export const undefinedAction = rateLimitedAction.handler(async ({ ctx }) => {
  return ctx
})

export const helloWorldTimeoutAction = createServerAction()
  .timeout(TEST_DATA.timeout)
  .handler(async () => {
    await sleep(TEST_DATA.timeout + 1000) // trigger timeout
    return "hello world" as const
  })

export const helloWorldProcedureTimeoutAction = timeoutAction.handler(
  async () => {
    await sleep(TEST_DATA.timeout + 1000) // trigger timeout
    return "hello world" as const
  }
)

export const helloWorldProtectedTimeoutAction = protectedTimeoutAction.handler(
  async () => {
    await sleep(TEST_DATA.timeout + 1000) // trigger timeout
    return "hello world" as const
  }
)

export const helloWorldRetryAction = publicAction
  .retry({
    maxAttempts: TEST_DATA.retries.maxAttempts,
    delay: TEST_DATA.retries.delay,
  })
  .handler(async () => {
    throw new Error("forcing retry")
  })

export const helloWorldExponentialRetryAction = publicAction
  .retry({
    maxAttempts: TEST_DATA.retries.maxAttempts,
    delay: (currentAttempt) =>
      TEST_DATA.retries.delay * Math.pow(2, currentAttempt - 1),
  })
  .handler(async () => {
    throw new Error("forcing retry")
  })

export const helloWorldRetryProcedureAction = retryAction.handler(async () => {
  return "hello world" as const
})
