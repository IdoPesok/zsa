"use server"

import { generateOpenApiDocument } from "zsa-openapi"
import { openApiRouter } from "./openapi"

export async function generateSpec() {
  return await generateOpenApiDocument(openApiRouter, {
    title: "ZSA OpenAPI",
    version: "1.0.0",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  })
}
