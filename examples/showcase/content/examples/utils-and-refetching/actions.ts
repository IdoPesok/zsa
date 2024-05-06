"use server"

import { createServerActionWrapper } from "server-actions-wrapper"
import z from "zod"

export const getRandomNumber = createServerActionWrapper()
  .createAction()
  .input(
    z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .refine((input) => input.min < input.max)
  )
  .handler(async ({ input, ctx }) => {
    await new Promise((r) => setTimeout(r, 1000))
    return {
      number: Math.floor(Math.random() * (input.max - input.min)) + input.min,
    }
  })
