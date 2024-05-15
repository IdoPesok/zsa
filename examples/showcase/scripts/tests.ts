import { createServerActionProcedure } from "server-actions-wrapper"
import { z } from "zod"

const main = async () => {
  const isAuth = createServerActionProcedure().handler(async ({ ctx }) => {
    return {
      user: {
        id: 123,
      },
    }
  })

  const ownsPost = createServerActionProcedure(isAuth)
    .input(z.object({ postId: z.string() }))
    .handler(async ({ ctx, input }) => {
      return {
        user: ctx.user,
        post: {
          id: input.postId,
        },
      }
    })

  const testAction = ownsPost.createServerAction().handler(async ({ ctx }) => {
    return ctx
  })

  console.log(
    await testAction({
      postId: "124124124",
    })
  )
}

main()
