"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerAction } from "zsa"

export const testAction = createServerAction()
  .input(
    z.object({
      name: z.string(),
    })
  )
  .handler(async ({ input }) => {
    revalidatePath("/tests/client/revalidate-path-error")
    throw "this failed"
  })
