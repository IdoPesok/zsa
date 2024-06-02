import { createOpenApiServerActionRouter } from "zsa-openapi"
import {
  divideAction,
  multiplyAction,
  multiplyActionWithCustomResponse,
  protectedMultiplyAction,
  subtractAction,
} from "./actions"

const publicRouter = createOpenApiServerActionRouter({
  pathPrefix: "/api",
  defaults: {
    tags: ["Calculations"],
  },
})
  .get("/calculations/multiply/{number1}", multiplyAction)
  .get(
    "/calculations/multiplyCustomResponse/{number1}",
    multiplyActionWithCustomResponse
  )
  .post("/calculations/multiply/{number1}", multiplyAction)
  .all("/calculations/divide/{number1}", divideAction)
  .all("/calculations/subtract/:number1/:number2", subtractAction)

const protectedRouter = createOpenApiServerActionRouter({
  pathPrefix: "/api/protected",
  defaults: {
    tags: ["Protected"],
    protect: true,
  },
})
  .get("/calculations/multiply/{number1}", protectedMultiplyAction)
  .post("/calculations/multiply/{number1}", protectedMultiplyAction)

export const openapiRouter = createOpenApiServerActionRouter({
  extend: [publicRouter, protectedRouter],
})
