import { z } from "zod"
import {
  ZSAError,
  chainServerActionProcedures,
  createServerAction,
  createServerActionProcedure,
} from "zsa"
import { TEST_DATA, auth, getPostById } from "./data"

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
  if (ctx.auth.id !== TEST_DATA.admin.id) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
  }

  return {
    auth: {
      ...ctx.auth,
      isAdmin: true as const,
    },
  }
})

export const adminAction = isAdminProcedure.createServerAction()

const ownsPostProcedure = createServerActionProcedure(protectedProcedure)
  .input(z.object({ postId: z.enum(["testUserAuthor", "notTestUserAuthor"]) }))
  .handler(async ({ ctx, input }) => {
    const post = getPostById(input.postId)

    if (!post || post.id === "notTestUserAuthor") {
      throw new ZSAError("NOT_AUTHORIZED", TEST_DATA.errors.doesNotOwnPost)
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

const rateLimitedProcedure = createServerActionProcedure(
  createServerActionProcedure().handler(async () => {
    return
  })
).handler(async () => {
  return
})

export const rateLimitedAction = rateLimitedProcedure.createServerAction()
