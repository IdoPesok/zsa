import { type NextRequest } from "next/server"
import { OpenAPIV3 } from "openapi-types"
import { pathToRegexp } from "path-to-regexp"
import { TAnyZodSafeFunctionHandler } from "zsa"
import {
  acceptsRequestBody,
  getErrorStatusFromZSAError,
  preparePathForMatching,
} from "./utils"

export type OpenApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

const FORM_DATA_CONTENT_TYPE = "application/x-www-form-urlencoded"
const JSON_CONTENT_TYPE = "application/json"

export type OpenApiContentType =
  | typeof FORM_DATA_CONTENT_TYPE
  | typeof JSON_CONTENT_TYPE
  | (string & {})

export interface ApiRouteHandler {
  (request: NextRequest): Promise<Response>
}

export interface OpenApiAction<THandler extends TAnyZodSafeFunctionHandler> {
  enabled?: boolean
  method: OpenApiMethod
  path: string
  summary?: string
  description?: string
  protect?: boolean
  tags?: string[]
  headers?: (OpenAPIV3.ParameterBaseObject & { name: string; in?: "header" })[]
  contentTypes?: OpenApiContentType[]
  deprecated?: boolean
  example?: {
    request?: Record<string, any>
    response?: Record<string, any>
  }
  responseHeaders?: Record<
    string,
    OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject
  >
  action: THandler
}

class OpenApiServerActionRouter {
  $INTERNALS: {
    pathPrefix?: string | undefined
    actions: OpenApiAction<any>[]
  }

  constructor(opts?: { pathPrefix?: string }) {
    let pathPrefix = opts?.pathPrefix

    if (pathPrefix?.endsWith("/") && pathPrefix !== "/") {
      // make sure the path prefix doesn't end with a slash
      pathPrefix = pathPrefix.slice(0, -1)
    } else if (pathPrefix === "/") {
      // make sure it isn't just a slash
      pathPrefix = ""
    }

    this.$INTERNALS = {
      pathPrefix,
      actions: [],
    }
  }

  get<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<THandler>, "path" | "method" | "action">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "GET",
      path: this.$createPath(path, "GET"),
      action,
    })
    return this
  }

  post<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "POST",
      path: this.$createPath(path, "POST"),
      action,
    })
    return this
  }

  delete<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "DELETE",
      path: this.$createPath(path, "DELETE"),
      action,
    })
    return this
  }

  put<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "PUT",
      path: this.$createPath(path, "PUT"),
      action,
    })
    return this
  }

  patch<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "PATCH",
      path: this.$createPath(path, "PATCH"),
      action,
    })
    return this
  }

  $createPath = (path: string, method: OpenApiMethod) => {
    const tmp = this.$INTERNALS.pathPrefix
      ? `${this.$INTERNALS.pathPrefix}${path}`
      : path
    if (tmp.endsWith("/") && tmp !== "/") {
      return tmp.slice(0, -1)
    }

    for (const action of this.$INTERNALS.actions) {
      // regex replace all {param} with {param}
      const tmpClean = tmp.replace(/\{[^}]+\}/g, "{param}") + method
      const actionPathClean =
        action.path.replace(/\{[^}]+\}/g, "{param}") + action.method

      if (tmpClean === actionPathClean) {
        throw new Error(`Duplicate path [${method}]: ${tmp} and ${action.path}`)
      }
    }

    return tmp
  }
}

export type TOpenApiServerActionRouter = OpenApiServerActionRouter

export const createOpenApiServerActionRouter = (args?: {
  pathPrefix?: `/${string}`
}): OpenApiServerActionRouter => {
  return new OpenApiServerActionRouter(args)
}

export const createRouteHandlers = (router: TOpenApiServerActionRouter) => {
  const parseRequest = async (
    request: NextRequest
  ): Promise<{
    input: Record<string, any> | undefined
    params: Record<string, string>
    searchParams: Record<string, string>
    action: TAnyZodSafeFunctionHandler
    body: Record<string, any> | undefined
  }> => {
    // get the search params
    const searchParams = request.nextUrl.searchParams
    const searchParamsJson = Object.fromEntries(searchParams.entries())

    const headers = new Headers(request.headers)
    let data: Object | undefined = undefined

    // if it has a body
    if (acceptsRequestBody(request.method)) {
      if (headers.get("content-type") === FORM_DATA_CONTENT_TYPE) {
        // if its form data
        data = await request.formData()
      } else if (headers.get("content-type") === JSON_CONTENT_TYPE) {
        // if its json
        data = await request.json()
      }
    }

    const params: Record<string, string> = {}

    // find the matching action from the router
    const foundMatch = router.$INTERNALS.actions.find((action) => {
      if (action.method !== request.method) {
        return false
      }

      if (action.path === request.nextUrl.pathname) {
        return true
      }

      if (!action.path.includes("{") || !action.path.includes("}")) return false

      const re = pathToRegexp(preparePathForMatching(action.path))
      const match = re.exec(
        request.nextUrl.pathname.split("?")[0] || "NEVER_MATCH"
      )

      if (!match) return false

      return true
    })

    // parse the params from the path
    if (foundMatch && foundMatch.path.includes("{")) {
      let basePathSplit = (foundMatch.path as string).split("/")
      let pathSplit = (
        request.nextUrl.pathname.split("?")[0] || "NEVER_MATCH"
      ).split("/")

      if (basePathSplit.length !== pathSplit.length) {
        return {} as any
      }

      // copy over the params
      for (let i = 0; i < basePathSplit.length; i++) {
        const basePathPart = basePathSplit[i]
        const pathPart = pathSplit[i]

        if (!basePathPart || !pathPart) {
          continue
        }

        if (basePathPart.startsWith("{") && basePathPart.endsWith("}")) {
          const foundPathPartName = basePathPart.slice(1, -1)
          params[foundPathPartName] = pathPart
        }
      }
    }

    // form the final input to be sent to the action
    const final = {
      ...searchParamsJson,
      ...(data || {}),
      ...params,
    }

    if (!foundMatch) {
      throw new Error("No matching action found")
    }

    if (Object.keys(final).length === 0) {
      return {
        input: undefined,
        params: {},
        searchParams: {},
        action: foundMatch.action,
        body: undefined,
      }
    }

    return {
      input: final,
      params,
      searchParams: searchParamsJson,
      action: foundMatch.action,
      body: data,
    }
  }

  const notFound = () => {
    return new Response("", {
      status: 404,
    })
  }

  const handler: ApiRouteHandler = async (request: NextRequest) => {
    const parsedData = await parseRequest(request)
    if (!parsedData) return notFound()

    try {
      const [data, err] = await parsedData.action(parsedData.input, undefined, {
        request: request,
      })

      if (err) {
        throw err
      }

      return new Response(JSON.stringify(data))
    } catch (error: unknown) {
      let status = getErrorStatusFromZSAError(error)

      return new Response(JSON.stringify({ error }), {
        status,
      })
    }
  }

  return {
    GET: handler,
    POST: handler,
    DELETE: handler,
    PUT: handler,
    PATCH: handler,
  }
}
