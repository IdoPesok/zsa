import { mockNextRequest } from "lib/utils"
import {
  divideAction,
  multiplyAction,
  nextNotFoundAction,
  nextRedirectAction,
  nextRedirectInProcedureAction,
} from "server/actions"
import { TEST_DATA } from "server/data"
import { openapiRouter } from "server/router"
import {
  createOpenApiServerActionRouter,
  createRouteHandlers,
  setupApiHandler,
} from "zsa-openapi"

describe("openapi", () => {
  describe("createOpenApiServerActionRouter", () => {
    it("should create a router with the correct paths", () => {
      const router = createOpenApiServerActionRouter({
        pathPrefix: "/api",
      })

      expect(router.$INTERNALS.pathPrefix).toBe("/api")
      expect(router.$INTERNALS.actions).toHaveLength(0)
      expect(router.$INTERNALS.defaults).toBeUndefined()
    })

    it("should create a router with the correct paths and defaults", () => {
      const router = createOpenApiServerActionRouter({
        pathPrefix: "/api",
        defaults: {
          tags: ["posts"],
          headers: [{ name: "Authorization", description: "Bearer token" }],
        },
      })

      expect(router.$INTERNALS.pathPrefix).toBe("/api")
      expect(router.$INTERNALS.actions).toHaveLength(0)
      expect(router.$INTERNALS.defaults).toEqual({
        tags: ["posts"],
        headers: [{ name: "Authorization", description: "Bearer token" }],
      })
    })

    it("should create an action with the correct path and defaults", () => {
      const router = createOpenApiServerActionRouter({
        pathPrefix: "/api",
        defaults: {
          tags: ["posts"],
          headers: [{ name: "Authorization", description: "Bearer token" }],
        },
      }).get("/posts", multiplyAction, {
        headers: [],
      })

      const action = router.$INTERNALS.actions[0]!

      expect(router.$INTERNALS.actions).toHaveLength(1)
      expect(action.path).toEqual("/api/posts")
      expect(action.tags).toEqual(["posts"])
      expect(action.headers).toEqual([])
      expect(action.method).toEqual("GET")
    })

    it("should throw if duplicate paths are defined", () => {
      expect(() =>
        createOpenApiServerActionRouter({
          pathPrefix: "/api",
        })
          .get("/posts", multiplyAction)
          .get("/posts", multiplyAction)
      ).toThrow()
    })

    it("should throw if similiar paths are defined", () => {
      expect(() =>
        createOpenApiServerActionRouter({
          pathPrefix: "/api",
        })
          .get("/posts/{number}", multiplyAction)
          .get("/posts/{number1}", multiplyAction)
      ).toThrow()
    })

    it(".all should create an action for every method", () => {
      const router = createOpenApiServerActionRouter({
        pathPrefix: "/api",
      }).all("/posts", multiplyAction)

      expect(router.$INTERNALS.actions).toHaveLength(5)

      const methods = router.$INTERNALS.actions.map((action) => action.method)
      expect(methods).toEqual(["GET", "POST", "DELETE", "PUT", "PATCH"])
    })
  })

  describe("createRouteHandlers", () => {
    it("should multiply two numbers [GET]", async () => {
      const { GET } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "GET",
        pathname: "/api/calculations/multiply/100",
        searchParams: {
          number2: "100",
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 * 100,
      })

      expect(response.headers.get("content-type")).toEqual("application/json")
    })

    it("should multiply two numbers with a custom response [GET]", async () => {
      const { GET } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "GET",
        pathname: "/api/calculations/multiplyCustomResponse/100",
        searchParams: {
          number2: "100",
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(201)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 * 100,
      })

      expect(response.headers.get("content-type")).toEqual("application/json")
      expect(response.headers.get("custom-header")).toEqual("123")
    })

    it("should fail to multiply a number and a string [GET]", async () => {
      const { GET } = createRouteHandlers(openapiRouter, {
        shapeError: (error) => {
          return {
            message: error.message,
            code: error.code,
          }
        },
      })

      const request = mockNextRequest({
        method: "GET",
        pathname: "/api/calculations/multiply/fail",
        searchParams: {
          number2: "100",
        },
      })

      const response = await GET(request)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.code).toBe("INPUT_PARSE_ERROR")
      expect(json.message).toBeDefined()
    })

    it("should multiply two numbers [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/multiply/100",
        body: {
          number2: "100",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 * 100,
      })
    })

    it("should multiply two numbers in form data [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const formData = new FormData()
      formData.append("number2", "100")

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/multiply/100",
        formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 * 100,
      })
    })

    it("should multiply one number in form data array [POST]", async () => {
      const { GET } = createRouteHandlers(openapiRouter)

      const formData = new FormData()
      formData.append("number", "100")

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/multiply-with-array",
        formData,
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100,
      })
    })

    it("should multiply two numbers in form data array [POST]", async () => {
      const { GET } = createRouteHandlers(openapiRouter)

      const formData = new FormData()
      formData.append("number", "100")
      formData.append("number", "100")

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/multiply-with-array",
        formData,
      })

      const response = await GET(request)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 * 100,
      })
    })

    it("should fail to multiply a number and a string [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/multiply/100",
        body: {
          number2: "nope",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it("should succeed after authenticating [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/protected/calculations/multiply/100",
        headers: {
          authorization: TEST_DATA.authorization.token,
        },
        body: {
          number2: "100",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 * 100,
      })

      expect(response.headers.get("x-test")).toEqual("123")
    })

    it("should fail to authenticate [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/protected/calculations/multiply/100",
        body: {
          number2: "100",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it("it should succeed in subtracting two numbers with :param [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/subtract/100/50",
        body: {
          number3: 5,
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 - 50 - 5,
      })
    })

    it("it should fail to divide a number by zero [POST]", async () => {
      const { POST } = createRouteHandlers(openapiRouter)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/divide/100",
        body: {
          number2: "0",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe("setupApiHandler", () => {
    it("it should succeed in dividing a number by zero [PUT]", async () => {
      const { PUT } = setupApiHandler(
        "/api/calculations/divide/{number1}",
        divideAction
      )

      const request = mockNextRequest({
        method: "PUT",
        pathname: "/api/calculations/divide/100",
        body: {
          number2: "20",
        },
      })

      const response = await PUT(request)
      expect(response.status).toEqual(200)

      const json = await response.json()
      expect(json).toEqual({
        result: 100 / 20,
      })
    })

    it("it should fail to divide a number by zero and return full error [POST]", async () => {
      const { POST } = setupApiHandler(
        "/api/calculations/divide/{number1}",
        divideAction
      )

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/divide/100",
        body: {
          number2: "0",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.code).toBe("INPUT_PARSE_ERROR")
      expect(json.message).toBeDefined()
      expect(json.name).toBeDefined()
    })

    it("it should fail to divide a number by zero and return a custom error [POST]", async () => {
      const { POST } = setupApiHandler(
        "/api/calculations/divide/{number1}",
        divideAction,
        {
          shapeError: (error) => {
            return {
              message: error.message,
              code: error.code,
            }
          },
        }
      )

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api/calculations/divide/100",
        body: {
          number2: "0",
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.code).toBe("INPUT_PARSE_ERROR")
      expect(json.message).toBeDefined()
    })
  })

  describe("next redirect", () => {
    it("throws the redirect error", async () => {
      const { POST } = setupApiHandler("/api", nextRedirectAction)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api",
      })

      await expect(POST(request)).rejects.toThrow("NEXT_REDIRECT")
    })
    it("throws the not found error", async () => {
      const { POST } = setupApiHandler("/api", nextNotFoundAction)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api",
      })

      await expect(POST(request)).rejects.toThrow("NEXT_NOT_FOUND")
    })
    it("throws the redirect error from the procedure", async () => {
      const { POST } = setupApiHandler("/api", nextRedirectInProcedureAction)

      const request = mockNextRequest({
        method: "POST",
        pathname: "/api",
      })

      await expect(POST(request)).rejects.toThrow("NEXT_REDIRECT")
    })
  })
})
