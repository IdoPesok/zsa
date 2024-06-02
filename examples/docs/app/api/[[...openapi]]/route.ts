import { createRouteHandlers } from "zsa-openapi"
import { openApiRouter } from "./openapi"

export const { GET, POST, PUT } = createRouteHandlers(openApiRouter)
