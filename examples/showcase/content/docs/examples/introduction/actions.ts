"use server"

import z from "zod"
import { createServerAction } from "zsa"

export const incrementNumberAction = createServerAction()
  .input(
    z.object({
      number: z.number(),
    })
  )
  .handler(async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return input.number + 1
  })

export const plainAction = createServerAction().handler(async () => {
  return "hello world"
})
