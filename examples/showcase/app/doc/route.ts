import { type NextRequest } from "next/server"
import { z } from "zod"
import { createServerAction } from "zsa"
import {
  createOpenApiServerActionRouter,
  generateOpenApiDocument,
} from "zsa-openapi"

const myServerAction = createServerAction()
  .input(z.object({ message: z.string(), something: z.string() }))
  .handler(async ({ input }) => {
    // Sleep for .5 seconds
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Update the message
    return input.message
  })

const myOtherAction = createServerAction()
  .input(z.object({ test: z.string() }))
  .handler(async ({ input }) => {
    // Sleep for .5 seconds
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Update the message
    return input.test
  })

const router = createOpenApiServerActionRouter({
  pathPrefix: "/api",
})

router.get("/hello/{message}", myServerAction, {
  tags: ["hello"],
  protect: true,
})

router.post("/hello", myOtherAction)

export const GET = async (request: NextRequest) => {
  return new Response(
    JSON.stringify(
      await generateOpenApiDocument(router, {
        title: "tRPC OpenAPI",
        version: "1.0.0",
        baseUrl: "http://localhost:3000",
      })
    )
  )
}
