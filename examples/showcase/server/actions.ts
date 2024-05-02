"use server"

import { z } from "zod"
import { protectedAction } from "./wrappers"

export const generateRandomNumber = protectedAction
  .createAction()
  .input(
    z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .refine((input) => input.min < input.max)
  )
  .handler(({ input, ctx }) => {
    console.log(ctx.user.name)

    return {
      number: Math.floor(Math.random() * (input.max - input.min)) + input.min,
    }
  })

export const getFakeData = protectedAction
  .createAction()
  .input(
    z
      .object({
        length: z.number(),
      })
      .default({ length: 10 })
  )
  .handler(async ({ input, ctx }) => {
    await new Promise((r) => setTimeout(r, 3000))
    if (!input) {
      return [1, 2, 3]
    }
    return Array.from({ length: input.length }, () => Math.random())
  })
