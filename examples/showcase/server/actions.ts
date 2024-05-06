"use server"

import { createServerActionWrapper } from "server-actions-wrapper"
import { z } from "zod"

export const getFakeData = createServerActionWrapper()
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
