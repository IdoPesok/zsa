"use server"

import {
  createServerAction,
  createServerActionProcedure,
} from "server-actions-wrapper"
import z from "zod"

async function getUser() {
  return {
    email: "",
    id: "",
  }
}

export const helloWorldAction = createServerAction()
  .input(z.object({ message: z.string() }))
  .timeout(1000) // Set the timeout to 1000ms (1 second)
  .handler(async ({ input }) => {
    // Simulating a random execution time between 0 and 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000 * Math.random()))
    return input.message
  })

;("use server")

const longRunningAuthedProcedure = createServerActionProcedure()
  .timeout(1000) // Set the timeout to 1000ms (1 second)
  .noInputHandler(async () => {
    try {
      const { email, id } = await getUser()
      await new Promise((resolve) => setTimeout(resolve, 2000 * Math.random()))
      return {
        user: {
          email,
          id,
        },
      }
    } catch {
      throw new Error("UNAUTHORIZED")
    }
  })

longRunningAuthedProcedure.createServerAction()
