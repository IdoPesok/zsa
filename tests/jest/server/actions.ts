"use server"

import { sleep } from "lib/utils"
import { z } from "zod"
import { createServerAction } from "zsa"
import { TEST_DATA } from "./data"
import {
  adminAction,
  faultyOutputProcedure,
  inputNumberProcedure,
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

export const faultyOutputInProcedureAction = faultyOutputProcedure
  .createServerAction()
  .handler(async () => {
    return
  })

export const faultyOutputAction = publicAction
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

export const transformedOutputAction = publicAction
  .output(
    z.object({
      number: z.number().transform((n) => 100),
    })
  )
  .handler(async () => {
    return {
      number: 1,
    }
  })

export const inputNumberAction = inputNumberProcedure
  .createServerAction()
  .handler(async ({ input }) => {
    return input
  })

export const inputLargeNumberAction = inputNumberProcedure
  .createServerAction()
  .input(
    z.object({
      number: z.number().refine((n) => n > 100),
    })
  )
  .handler(async ({ input }) => {
    return input
  })

export const multiplyAction = publicAction
  .input(
    z.object({
      number2: z.coerce.number(),
      number1: z.coerce.number(),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number1 * input.number2,
    }
  })

export const protectedMultiplyAction = protectedAction
  .input(
    z.object({
      number2: z.coerce.number(),
      number1: z.coerce.number(),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number1 * input.number2,
    }
  })

export const divideAction = publicAction
  .input(
    z.object({
      number1: z.coerce.number(),
      number2: z.coerce.number().refine((n) => n !== 0),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number1 / input.number2,
    }
  })
