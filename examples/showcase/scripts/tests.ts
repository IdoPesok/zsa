import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
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
    .input(z.object({ postId: z.string() }).default({ postId: "" }))
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

  const other = createServerActionProcedure(postIdOwner)
    .input(z.object({ otherId: z.string() }))
    .handler(async ({ input, ctx }) => {
      console.log("RUNNING OTHER HANDLER", input, ctx)
      await new Promise((r) => setTimeout(r, 1000))
      // validate other id owner here
      return {
        user: ctx.user,
        post: ctx.post,
        test: {
          other: input.otherId,
          hello: "world",
        } as const,
      }
    })

  const wrapper = createServerActionWrapper()
    .procedure(isAuthed)
    .chainProcedure(postIdOwner)
    .chainProcedure(other)

  const a = wrapper
    .createAction()
    .input(z.object({ hmmmm: z.string() }).default({ hmmmm: "" }))
    .handler(async ({ input, ctx }) => {
      console.log("RUNNING MAIN HANDLER")
      await new Promise((r) => setTimeout(r, 1000))
      console.log({
        hmmmm: input.hmmmm,
        otherId: input.otherId,
        postId: input.postId,

        user: ctx.user,
        post: {
          id: ctx.post.id,
        },
        test: {
          hello: ctx.test.hello,
        },
      })

      return "GREAT SUCCESS"
    })

  const [data, err] = await a(undefined)

  console.log("data", data)
  console.log("err", err)
}

main()
