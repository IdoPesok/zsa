import { createServerAction, createServerActionProcedure } from "@za/server"
import { z } from "zod"

const main = async () => {
  const isAuth = createServerActionProcedure().handler(async () => {
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

  const updatePostTitle = ownsPost
    .createServerAction()
    .handler(async ({ ctx, input }) => {
      return ctx
    })

  const test = createServerAction().handler(async ({ input }) => {
    return {
      user: {
        id: 123,
      },
    }
  })

  console.log(
    await updatePostTitle({
      postId: "124124124",
    })
  )
}

main()
