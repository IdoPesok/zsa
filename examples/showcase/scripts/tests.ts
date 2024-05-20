import { z } from "zod"
import { createServerActionProcedure } from "zsa"

const main = async () => {
  const procedure = createServerActionProcedure()
    .input(z.object({ postId: z.string() }))
    .handler(async ({ input }) => {
      return {
        user: {
          id: 123,
          name: input.postId,
        },
      }
    })

  const myAction = procedure
    .createServerAction()
    .input(z.object({ name: z.string(), email: z.string() }), {
      type: "formData",
    })
    .handler(async ({ input, ctx }) => {
      return {
        user: {
          id: 123,
          name: input.name,
        },
      }
    })

  const formData = new FormData()

  formData.append("name", "test")
  formData.append("email", "test@example.com")

  await myAction(formData, {
    postId: "hello world",
  })
}

main()
