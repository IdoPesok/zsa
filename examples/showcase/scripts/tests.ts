import { SAWError, createServerActionProcedure } from "server-actions-wrapper"
import { z } from "zod"

const main = async () => {
  const isAuthed = createServerActionProcedure()
    .input(z.object({ userId: z.string() }))
    .onError((err) => {
      console.log("onError in auth called", err)
    })
    .handler(async ({ input }) => {
      console.log("isAuthed", Date.now())
      console.log("got input", JSON.stringify(input, null, 2))

      await new Promise((r) => setTimeout(r, 1000))
      return {
        user: {
          name: "IDO",
          id: input.userId,
        },
      }
    })

  const ownsPost = createServerActionProcedure(isAuthed) // child of isAuthed
    .input(
      z
        .object({ postId: z.string() })
        .transform((v) => ({ postId: v.postId.toUpperCase() }))
    )
    .handler(async ({ input, ctx }) => {
      let shouldError = true
      if (shouldError) {
        throw new SAWError("ERROR", "yo this just errored")
      }

      console.log("ownsPost", Date.now())
      console.log("got input", JSON.stringify(input, null, 2))
      console.log("got ctx", JSON.stringify(ctx, null, 2))
      await new Promise((r) => setTimeout(r, 1000))
      return {
        ...ctx,
        post: {
          id: input.postId,
        },
      }
    })

  const myAction = ownsPost
    .createServerAction()
    .input(z.object({ somethingElse: z.string().default("testing") }))
    .onError((err) => {
      console.log("onError in action called", err)
    })
    .handler(async ({ input, ctx }) => {
      console.log("FINAL", Date.now())
      console.log("got input", JSON.stringify(input, null, 2))
      console.log("got ctx", JSON.stringify(ctx, null, 2))

      return "YOOOOOOO"
    })

  console.log("here")

  // const [data, err] = await myAction({
  //   userId: "user_id_123",
  //   somethingElse: "hello world",
  //   postId: "post_id_123",
  // })

  // if (err) {
  //   console.log(err)
  //   return
  // }

  // console.log("got data", data) // typesafe, not null
}

main()
