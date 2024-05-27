import { type NextRequest } from "next/server"
import { generateOpenApiDocument } from "zsa-openapi"
import { router } from "./route"

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
