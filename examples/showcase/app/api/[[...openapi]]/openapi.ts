import { z } from "zod"
import { createServerAction, createServerActionProcedure } from "zsa"
import { createOpenApiServerActionRouter } from "zsa-openapi"

const getReply = createServerAction()
  .input(
    z.object({ postId: z.string(), replyId: z.string(), message: z.string() })
  )
  .handler(async ({ input, request }) => {
    // Sleep for .5 seconds
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Update the message
    return {
      input,
      auth: request ? request.headers.get("authorization") : undefined,
    }
  })

const updateProcedure = createServerActionProcedure().handler(
  ({ responseMeta }) => {
    if (responseMeta) {
      responseMeta.statusCode = 201
      responseMeta.headers.set("x-custom-header", "custom-value")
    }
  }
)

const other = createServerActionProcedure(updateProcedure).handler(
  ({ responseMeta, ctx }) => {
    if (responseMeta) {
      responseMeta.statusCode = 201
    }
  }
)

const updatePost = other
  .createServerAction()
  .input(z.object({ postId: z.string() }))
  .handler(async ({ input, ctx }) => {
    // Sleep for .5 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

const createPost = updatePost
const getPosts = createPost

export const openApiRouter = createOpenApiServerActionRouter({
  pathPrefix: "/api",
})
  .get("/", getPosts, {
    tags: ["posts"],
  })
  .post("/posts", createPost, {
    tags: ["posts"],
  })
  .put("/posts/{postId}", updatePost, {
    tags: ["posts"],
  })
  .get("/posts/{postId}/replies/{replyId}", getReply, {
    tags: ["replies"],
    protect: true,
  })
