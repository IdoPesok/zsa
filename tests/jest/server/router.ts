import { createOpenApiServerActionRouter } from "zsa-openapi"
import {
  divideAction,
  multiplyAction,
  multiplyActionWithArray,
  multiplyActionWithCustomResponse,
  multiplyActionWithDefaultObject,
  multiplyActionWithDefaultValues,
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
  .post("/calculations/multiply-with-array", multiplyActionWithArray)
  .get(
    "/calculations/multiplyCustomResponse/{number1}",
    multiplyActionWithCustomResponse
  )
  .post("/calculations/multiply/{number1}", multiplyAction)
  .all("/calculations/divide/{number1}", divideAction)
  .all("/calculations/subtract/:number1/:number2", subtractAction)
  .all(
    "/calculations/multiplyWithDefaultObject",
    multiplyActionWithDefaultObject
  )
  .all(
    "/calculations/multiplyWithDefaultValues",
    multiplyActionWithDefaultValues
  )

const protectedRouter = createOpenApiServerActionRouter({
  pathPrefix: "/api/protected",
  defaults: {
    tags: ["Protected"],
    protect: true,
  },
})
  .get("/calculations/multiply/{number1}", protectedMultiplyAction)
  .post("/calculations/multiply/{number1}", protectedMultiplyAction)

export const jsonOnlyRouter = createOpenApiServerActionRouter({
  pathPrefix: "/api",
}).post("/calculations/multiply-with-array", multiplyActionWithArray)

export const openapiRouter = createOpenApiServerActionRouter({
  extend: [publicRouter, protectedRouter],
  defaults: {
    contentTypes: [
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
    ],
  },
})
