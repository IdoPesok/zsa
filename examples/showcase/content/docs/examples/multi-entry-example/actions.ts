"use server"

import z from "zod"
import { createServerAction } from "zsa"

export const multiplyNumbersAction = createServerAction()
  .input(
    z.object({
      number: z.array(z.coerce.number()),
    }),
    {
      type: "state",
    }
  )
  .handler(async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return input.number.reduce((a, b) => a * b, 1)
  })
