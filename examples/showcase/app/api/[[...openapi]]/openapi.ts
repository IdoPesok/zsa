import { z } from "zod"
import { createServerAction } from "zsa"
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

const updatePost = createServerAction()
  .input(z.object({ postId: z.string() }))
  .handler(async ({ input }) => {
    // Sleep for .5 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Update the message
    return input.postId
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
