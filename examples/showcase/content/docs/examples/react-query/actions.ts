"use server"

import z from "zod"
import { createServerAction } from "zsa"

export async function Hello() {
  return "hello"
}

export const helloWorldAction = createServerAction()
  .input(
    z.object({
      message: z.string(),
    })
  )
  .handler(async ({ input }) => {
    // sleep for .5 seconds
    await new Promise((resolve) => setTimeout(resolve, 500))
    // update the message
    return {
      result: "Hello World: " + (input.message || "N/A"),
    }
  })
