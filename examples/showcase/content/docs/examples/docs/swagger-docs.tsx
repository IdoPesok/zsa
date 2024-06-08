"use client"

import { generateSpec } from "@/app/api/[[...openapi]]/actions"
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
      const spec = await generateSpec()
      setSpec(spec)
    }

    generate()
  }, [])

  if (!spec) {
    return <div>Loading...</div>
  }

  return <SwaggerUI spec={spec} />
}
