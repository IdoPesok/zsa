"use server"

import z from "zod"
import { createServerAction } from "zsa"

export const multiplyNumbersAction = createServerAction()
  .input(
    z.object({
      // an array of numbers
      number: z.array(z.coerce.number()),
      // an array of files
      filefield: z.array(
        z
          .instanceof(File)
          .refine((file) => file.size > 0, "File cannot be empty")
          .refine((file) => file.size < 1024, "File size must be less than 1kb")
      ),
    }),
    {
      type: "state",
    }
  )
  .handler(async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return (
      input.number.reduce((a, b) => a * b, 1) +
      ` and got ${input.filefield.length} files`
    )
  })
