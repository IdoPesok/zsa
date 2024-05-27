# zsa-openapi

`zsa-openapi` is a powerful library that allows you to expose your [ZSA (Zod Server Actions)](https://github.com/zsa) server actions as RESTful endpoints in your application while adhering to OpenAPI standards. It provides an easy way to create a RESTful API router and automatically generate valid, industry-standard OpenAPI documentation (OAS-compliant structure) for your server actions.

## Installation

To get started with `zsa-openapi`, install it using your preferred package manager:

```bash
npm install zsa-openapi
```

## Usage

### Creating a RESTful API Router

To expose your server actions as RESTful endpoints, create an OpenAPI router using `createOpenApiServerActionRouter`. Define your routes by chaining HTTP methods (e.g., `get`, `post`, `put`) and providing the path, server action, and optional configuration.

```typescript
import {
  createOpenApiServerActionRouter,
  createRouteHandlers,
} from "zsa-openapi"
import { createPost, updatePost, getReply, getPosts } from "./actions"

const router = createOpenApiServerActionRouter({
  pathPrefix: "/api",
})
  .get("/posts", getPosts, {
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
  })

export const { GET, POST, PUT } = createRouteHandlers(router)
```

### Generating OpenAPI Documentation

To generate OpenAPI documentation for your RESTful API, use the `generateOpenApiDocument` function. Pass your router and additional configuration options to generate the documentation.

```typescript
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { generateOpenApiDocument } from "zsa-openapi"
import { router } from "../api/[[...openapi]]/route"

export default async function DocsPage() {
  const spec = await generateOpenApiDocument(router, {
    title: "tRPC OpenAPI",
    version: "1.0.0",
    baseUrl: "http://localhost:3000",
  })

  return <SwaggerUI spec={spec} />
}
```

### Single Endpoint Exposure

If you want to expose a single server action as an endpoint, you can use the `setupApiHandler` function.

```typescript
import { setupApiHandler } from "zsa-openapi"
import { getReply } from "./actions"

export const { GET } = setupApiHandler(
  "/posts/{postId}/replies/{replyId}",
  getReply
)
```

## Authentication

When exposing server actions using `createOpenApiServerActionRouter` or `setupApiHandler`, the `NextRequest` object is automatically available in your defined actions and procedures. This allows you to access request information, such as headers, for authentication purposes.

```typescript
export const getReplyWithHeaders = createServerAction()
  .input(
    z.object({ postId: z.string(), replyId: z.string(), message: z.string() })
  )
  .handler(async ({ input, request }) => {
    if (request) {
      const apiKey = request.headers.get("authorization")?.split(" ")[1]

      if (!apiKey || apiKey !== "123") {
        throw new Error("NOT_AUTHORIZED")
      }

      // Authentication successful
      return {
        user: {
          id: 123,
          name: "test",
        },
      }
    } else {
      // Authenticate with cookies
      const user = await auth()

      return {
        user,
      }
    }
  })
```

## Credits

The functionality of `zsa-openapi` is heavily inspired by and built upon the work done in [trpc-openapi](https://github.com/jlalmes/trpc-openapi). We owe a lot of credit to `trpc-openapi` for making this possible.

## License

`zsa-openapi` is open-source software licensed under the [MIT license](LICENSE).
