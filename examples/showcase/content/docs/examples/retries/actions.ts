"use server"

import { createServerAction, createServerActionProcedure } from "zsa"

export const retryExample = createServerAction()
  .retry({
    maxAttempts: 3,
  })
  .handler(async () => {
    //throw an error 50% of the time
    if (Math.random() > 0.5) {
      throw new Error("Random error")
    }
    return "Success!"
  })

export const retryWithDelay = createServerAction()
  .retry({
    maxAttempts: 3,
    delay: 1000,
  })
  .handler(async () => {
    //throw an error 50% of the time
    if (Math.random() > 0.5) {
      throw new Error("Random error")
    }
    return "Success!"
  })

export const retryWithProgressiveDelay = createServerAction()
  .retry({
    maxAttempts: 3,
    delay: (currentAttempt, err) => {
      return 1000 * currentAttempt
    },
  })
  .handler(async () => {
    //throw an error 50% of the time
    if (Math.random() > 0.5) {
      throw new Error("Random error")
    }
    return "Success!"
  })

export const retryProcedure = createServerActionProcedure()
  .retry({
    maxAttempts: 3,
  })
  .handler(async () => {
    if (Math.random() > 0.5) {
      throw new Error("Random error")
    }
    return {
      user: {
        id: "123",
        email: "test@example.com",
      },
    }
  })

export const exampleAction = retryProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return ctx
  })
