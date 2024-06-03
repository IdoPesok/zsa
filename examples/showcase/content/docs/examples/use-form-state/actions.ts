"use server"

import z from "zod"
import { createServerAction } from "zsa"

const produceNewMessageAction = createServerAction()
  .input(
    z.object({
      name: z.string(),
    }),
    {
      type: "formData",
    }
  )
  .handler(async ({ input }) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return "Hello, " + input.name
  })

export const produceNewMessage = async (
  previousState: string[],
  formData: FormData
) => {
  const [data, err] = await produceNewMessageAction(formData)

  if (err) {
    // handle error
    return previousState
  }

  return [...previousState, data]
}
