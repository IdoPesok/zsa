"use client"

import { router } from "@/app/api/[[...openapi]]/route"
import { useEffect, useState } from "react"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { generateOpenApiDocument } from "zsa-openapi"

export default function DocsPage() {
  const [spec, setSpec] = useState<Awaited<
    ReturnType<typeof generateOpenApiDocument>
  > | null>(null)

  useEffect(() => {
    const generate = async () => {
      const spec = await generateOpenApiDocument(router, {
        title: "ZSA OpenAPI",
        version: "1.0.0",
        baseUrl: "http://localhost:3000",
      })

      setSpec(spec)
    }

    generate()
  }, [])

  if (!spec) {
    return <div>Loading...</div>
  }

  return <SwaggerUI spec={spec} />
}
