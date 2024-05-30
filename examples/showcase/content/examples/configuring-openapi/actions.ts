"use server"

const auth = () => {}

import { z } from "zod"
import { createServerAction } from "zsa"
import { setupApiHandler } from "zsa-openapi"

export const createPost = createServerAction()
  .input(z.object({ message: z.string() }))
  .handler(async ({ input }) => {
    // add your logic here
  })

export const updatePost = createServerAction()
  .input(z.object({ postId: z.string(), message: z.string() }))
  .handler(async ({ input }) => {
    // add your logic here
  })

export const headersExample = createServerAction()
  .input(z.object({ message: z.string() }))
  .handler(async ({ input, request }) => {
    return {
      input,
      auth: request ? request.headers.get("authorization") : undefined,
    }
  })

export const getReply = createServerAction()
  .input(
    z.object({ postId: z.string(), replyId: z.string(), message: z.string() })
  )
  .handler(async ({ input }) => {
    // add your logic here
  })

export const getReplyWithHeaders = createServerAction()
  .input(
    z.object({ postId: z.string(), replyId: z.string(), message: z.string() })
  )
  .handler(async ({ input, request }) => {
    if (request) {
      // authenticate with headers
      const apiKey = request.headers.get("authorization")?.split(" ")[1]

      if (!apiKey || apiKey !== "123") {
        throw new Error("NOT_AUTHORIZED")
      }

      return {
        user: {
          id: 123,
          name: "test",
        },
      }
    } else {
      // authenticate with cookies
      const user = await auth()

      return {
        user,
      }
    }
  })

export const { GET } = setupApiHandler(
  "/posts/{postId}/replies/{replyId}",
  getReply
)
