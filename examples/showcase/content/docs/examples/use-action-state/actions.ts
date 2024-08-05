"use server"

import z from "zod"
import { createServerAction } from "zsa"

export const produceNewMessage = createServerAction()
  .input(
    z.object({
      name: z.string().min(5),
    }),
    {
      type: "state",
    }
  )
  .handler(async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return "Hello, " + input.name
  })

export const produceNewMessageSkipInputParsing = createServerAction()
  .input(
    z.custom<FormData>(),
    {
      type: "state",
      skipInputParsing: true
    }
  )
  .handler(async ({ input }) => {
    const payload = Object.fromEntries(input)

    const result = z.object({
      name: z.string().min(5)
    }).safeParse(payload)

    if (result.error) {
      throw result.error
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    return "Hello, " + result.data.name
  })