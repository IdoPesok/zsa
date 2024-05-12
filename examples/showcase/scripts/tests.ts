import { SAWError, createServerAction, createServerActionProcedure } from "server-actions-wrapper/src"
import { z } from "zod"

const auth = () => {
  return { user: { name: "IDO", id: "user_id_123" } } as const
}


const getPost = (id: string) => {
  return { post: { id: id, authorId: "user_id_123" } } as const
}

const main = async () => {
  const isAuthed = createServerActionProcedure().noInputHandler(async () => {
    console.log("isAuthed", Date.now())
    const user = await auth()
    await new Promise((r) => setTimeout(r, 1000))
    return user
  })

  const ownsPost = createServerActionProcedure(isAuthed) // child of isAuthed
    .input(
      z
        .object({ postId: z.string() })
        .transform((v) => ({ postId: v.postId.toUpperCase() }))
    )
    .handler(async ({ input, ctx }) => {
      const postData = await getPost(input.postId)
      if (postData.post.authorId !== ctx.user.id) {
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

  const [data, err] = await myAction({
    somethingElse: "hello world",
    postId: "post_id_123",
  })

  if (err) {
    console.log(err)
    return
  }

  console.log("got data", data) // typesafe, not null
}

main()
