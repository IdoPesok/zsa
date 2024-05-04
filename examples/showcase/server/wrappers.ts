import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
import { z } from "zod"


const admin = createServerActionProcedure()
  .input(z.object({ user: z.object({ id: z.number(), name: z.string() }) }))
  .handler(async ({ input }) => {
    if (input.user.id !== 1) throw new Error("You are not authorized")
    return {
      user: input.user,
      isAdmin: true,
      message: `hello ${input.user}`,
    } as const
  })

const getPost = (id: string) => true
const getUserOwnsPost = (str: string, str1: number) => true


const protectedProcedure = createServerActionProcedure()
  .noInputHandler(async () => {
    return {
      user: {
        name: "IDO",
        id: 1,
        email: "dsfdsfdsf",
      },
    }
  })



const postExistsProcedure = createServerActionProcedure()
  .input(z.object({ postId: z.string() }))
  .handler(async ({ input }) => {
    const valid = await getPost(input.postId)

    if (!valid) throw Error()

    return valid
  })


const baseAction = createServerActionWrapper()

export const postAction = baseAction.procedure(postExistsProcedure)

postAction.createActionWithProcedureInput().input(z.object({
  postId: z.string(),
  newPostName: z.string(),
})).handler(async ({ input, ctx }) => {
  //we are now sure that at this point the user owns the procedure
})

export const updateEmailAction = protectedAction
  .createAction()
  .input(z.object({
    newEmail: z.string()
  }))
  .handler(async ({ input, ctx }) => {
    const { userId } = ctx

    await db.update(users).set({
      email: newEmail,
    }).where(eq(users.id, userId))
  })

export const adminAction = protectedAction.chainProcedure(admin)
