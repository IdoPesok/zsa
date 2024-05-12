import { createServerActionProcedure } from "server-actions-wrapper/src"
import { z } from "zod";

const getUser = () => {
  return {
    email: "",
    id: "",
  }
}

const getUserRole = (str: string) => {
  return ""
}

export const authedProcedure = createServerActionProcedure()
  .noInputHandler(async () => {
    try {
      const { email, id } = await getUser();

      return {
        user: {
          email,
          id,
        }
      }
    } catch {
      throw new Error("User not authenticated")
    }
  })



const updateEmail = authedProcedure
  .createServerAction()
  .input(z.object({
    newEmail: z.string()
  })).handler(async ({ input, ctx }) => {
    const { user } = ctx


    return input.newEmail
  })


const isAdminProcedure = createServerActionProcedure(authedProcedure)
  .noInputHandler(async ({ ctx }) => {
    const role = getUserRole(ctx.user.id)

    if (role !== "admin") {
      throw new Error("User is not an admin")
    }

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email
      }
    }
  })



const deleteUser = isAdminProcedure
  .createServerAction()
  .input(z.object({
    userIdToDelete: z.string()
  })).handler(async ({ input, ctx }) => {
    const { userIdToDelete } = input
    const { user } = ctx // receive the context from the isAdminProcedure procedure

    // Delete user from database
    // await db.delete(users).where(eq(users.id, userIdToDelete))

    return userIdToDelete
  })


const checkUserOwnsPost = (id1: string, id2: string) => true

const ownsPostProcedure = createServerActionProcedure(isAdminProcedure)
  .input(
    z.object({ postId: z.string() })
  )
  .handler(async ({ input, ctx }) => {

    //validate post ownership
    const ownsPost = await checkUserOwnsPost(ctx.user.id, input.postId)

    if (!ownsPost) {
      throw new Error("UNAUTHORIZED")
    }

    return {
      user: ctx.user,
      post: {
        id: input.postId,
      },
    }
  })


const updatePostName = ownsPostProcedure
  .createServerAction()
  .input(z.object({ newPostName: z.string() }))
  .handler(async ({ input, ctx }) => {

    console.log({
      // input contains postId and newPostName
      newPostName: input.newPostName,
      postId: input.postId,
      // ctx contains user and post returned by procedures
      user: ctx.user,
      post: ctx.post,
    })

    return "GREAT SUCCESS"
  })

const [data, err] = await updatePostName({
  newPostName: "hello world",
  postId: "post_id_123",
})