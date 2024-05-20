"use server"

import z from "zod"
import { createServerAction } from "zsa"

export const myFormDataAction = createServerAction()
  .input(
    z.object({
      name: z.string(),
      email: z.string(),
    }),
    {
      type: "formData",
    }
  )
  .handler(async ({ input }) => {
    console.log("got input", input)
    // Process the input data
    return {
      message: `Received data: ${input.name}, ${input.email}`,
    }
  })
