"use server"

import z from "zod"
import { createServerAction } from "zsa"

export const getRandomNumber = createServerAction()
  .input(
    z.object({
      min: z.number(),
      max: z.number(),
    })
  )
  .handler(async ({ input, ctx }) => {
    await new Promise((r) => setTimeout(r, 1000))
    return {
      number: Math.floor(Math.random() * (input.max - input.min)) + input.min,
    }
  })
