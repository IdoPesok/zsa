"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
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
    // revalidatePath("/test")
    redirect("/slow")

    return `Hello, ${input.name}!`
  })

export const resetTestCookies = async () => {
  cookies().set("testing", "false")
  revalidatePath("/test")
}
