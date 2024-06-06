"use server"

import { revalidatePath } from "next/cache"
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

    revalidatePath("/revalidate", "page")

    return input.number + 2
  })

export const plainAction = createServerAction().handler(async () => {
  return "hello world"
})
