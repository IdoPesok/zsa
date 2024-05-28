import { z } from "zod"
import {
  ZSAError,
  chainServerActionProcedures,
  createServerAction,
  createServerActionProcedure,
} from "zsa"
import { TEST_USER_ADMIN_ID, auth, getPostById } from "./data"

export const publicAction = createServerAction()

const protectedProcedure = createServerActionProcedure().handler(async () => {
  return {
    auth: auth(),
  }
})

export const protectedAction = protectedProcedure.createServerAction()

const isAdminProcedure = createServerActionProcedure(
  protectedProcedure
).handler(async ({ ctx }) => {
  if (ctx.auth.id !== TEST_USER_ADMIN_ID) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
  }

  return {
    auth: {
      ...ctx.auth,
      isAdmin: true,
    },
  }
})

export const adminAction = isAdminProcedure.createServerAction()

const ownsPostProcedure = createServerActionProcedure(protectedProcedure)
  .input(z.object({ postId: z.enum(["testUserAuthor", "notTestUserAuthor"]) }))
  .handler(async ({ ctx, input }) => {
    const post = getPostById(input.postId)

    if (!post || post.id === "notTestUserAuthor") {
      throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
    }

    return {
      user: ctx.auth,
      post,
    }
  })

export const ownsPostAction = ownsPostProcedure.createServerAction()

const ownsPostIsAdminProcedure = chainServerActionProcedures(
  isAdminProcedure,
  ownsPostProcedure
)

export const ownsPostIsAdminAction =
  ownsPostIsAdminProcedure.createServerAction()
