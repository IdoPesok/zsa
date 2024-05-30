import {
  createOpenApiServerActionRouter,
  createRouteHandlers,
} from "zsa-openapi"
import { createPost, getReply, updatePost } from "./actions"

export const router = createOpenApiServerActionRouter({
  pathPrefix: "/api",
})
  .post("/posts", createPost, {
    tags: ["posts"],
  })
  .put("/posts/{postId}", updatePost, {
    tags: ["posts"],
  })
  .post("/posts/{postId}/replies/{replyId}", getReply, {
    tags: ["replies"],
  })

export const { GET, POST, PUT } = createRouteHandlers(router)
