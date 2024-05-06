import { createServerActionProcedure } from "server-actions-wrapper"
import { z } from "zod"

const main = async () => {
  const isAuthed = createServerActionProcedure().noInputHandler(async () => {
    console.log("RUNNING IS AUTHED HANDLER")
    await new Promise((r) => setTimeout(r, 1000))
    return {
      user: {
        name: "IDO",
      },
    }
  })

  const postIdOwner = createServerActionProcedure(isAuthed)
    .input(
      z.object({ postId: z.string() }).transform((v) => ({
        postId: `transformed to ` + v.postId.toUpperCase(),
      }))
    )
    .handler(async ({ input, ctx }) => {
      console.log("RUNNING POST HANDLER", input, ctx)
      await new Promise((r) => setTimeout(r, 1000))
      // validate post id owner here
      return {
        user: ctx.user,
        post: {
          id: input.postId,
        },
      }
    })

  // const updatePostName = wrapper
  //   .createAction()
  //   .input(z.object({ newPostName: z.string() }))
  //   .handler(async ({ input, ctx }) => {
  //     console.log({
  //       newPostName: input.newPostName,
  //       postId: input.postId,

  //       user: ctx.user,
  //       post: {
  //         id: ctx.post.id,
  //       },
  //     })

  //     return "GREAT SUCCESS"
  //   })

  // const [data, err] = await updatePostName({
  //   postId: "randomID",
  //   newPostName: 'testing'
  // })

  // console.log("data", data)
  // console.log("err", err)
}

main()
