import { z } from "zod"
import {
  SAWError,
  chainServerActionProcedures,
  createServerActionProcedure,
} from "../../../packages/server-actions-wrapper/dist"

const posts: any = 5
const db: any = 5

const auth = () => {
  return { user: { name: "IDO", id: "user_id_123" } }
}

const getPost = (id: string) => {
  return { post: { id: id, authorId: "user_id_123" } } as const
}

const main = async () => {
  const isAuthed = createServerActionProcedure().noInputHandler(async () => {
    const user = await auth()
    if (!user) throw new SAWError("NOT_AUTHORIZED", "get outta here")
    return {
      auth: user,
    }
  })

  const isAdmin = createServerActionProcedure(isAuthed).noInputHandler(
    async ({ ctx }) => {
      if (ctx.auth.user.id !== "user_id_123")
        throw new SAWError("NOT_AUTHORIZED", "get outta here")

      return {
        auth: {
          ...ctx.auth,
          isAdmin: true,
        },
      }
    }
  )

  const ownsPost = createServerActionProcedure(isAuthed) // child of isAuthed
    .input(z.object({ postId: z.string() }))
    .handler(async ({ input, ctx }) => {
      const postData = await getPost(input.postId)
      if (postData.post.authorId !== ctx.auth.user.id) {
        throw new SAWError("NOT_AUTHORIZED", "get outta here")
      }

      return {
        ...ctx,
        post: {
          id: input.postId,
        },
      }
    })

  const ownsPostIsAdmin = chainServerActionProcedures(isAdmin, ownsPost)

  const updatePost = ownsPostIsAdmin
    .createServerAction()
    .input(z.object({ title: z.string() }))
    .handler(async ({ input, ctx }) => {
      // do some db stuff here

      input.postId // type-safe
      input.title // type-safe

      ctx.auth // type-safe
      ctx.post // type-safe

      return "YOOOOOOO"
    })

  const [data, err] = await updatePost({
    title: "hello world",
    postId: "post_id_123",
  })

  if (err) {
    console.log(err)
    return
  }

  console.log("got data", data) // typesafe, not null
}

main()
