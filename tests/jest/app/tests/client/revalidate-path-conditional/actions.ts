"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"
import { createServerAction } from "zsa"

export const testAction = createServerAction()
  .input(
    z.object({
      name: z.string(),
    })
  )
  .handler(async ({ input }) => {
    cookies().set("testing", "true")
    revalidatePath("/tests/client/revalidate-path-conditional")

    return `Hello, ${input.name}!`
  })
