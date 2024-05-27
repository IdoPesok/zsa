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

export interface OpenApiAction<
  TSegment extends string,
  THandler extends TAnyZodSafeFunctionHandler,
> {
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
  action: TAnyZodSafeFunctionHandler
}

const createPath = (pathPrefix: string | undefined, path: string) => {
  const tmp = pathPrefix ? `${pathPrefix}${path}` : path
  if (tmp.endsWith("/") && tmp !== "/") {
    return tmp.slice(0, -1)
  }

  return tmp
}

class OpenApiServerActionRouter {
  $INTERNALS: {
    pathPrefix?: string | undefined
    actions: OpenApiAction<any, any>[]
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

  get<TSegment extends string, THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<TSegment, THandler>, "path" | "method" | "action">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "GET",
      path: createPath(this.$INTERNALS.pathPrefix, path),
      action,
    })
    return this
  }

  post<TSegment extends string, THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<TSegment, THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "POST",
      path: createPath(this.$INTERNALS.pathPrefix, path),
      action,
    })
    return this
  }

  delete<TSegment extends string, THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<TSegment, THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "DELETE",
      path: createPath(this.$INTERNALS.pathPrefix, path),
      action,
    })
    return this
  }

  put<TSegment extends string, THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<TSegment, THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "PUT",
      path: createPath(this.$INTERNALS.pathPrefix, path),
      action,
    })
    return this
  }

  patch<TSegment extends string, THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: Omit<OpenApiAction<TSegment, THandler>, "path" | "action" | "method">
  ) {
    this.$INTERNALS.actions.push({
      ...args,
      method: "PATCH",
      path: createPath(this.$INTERNALS.pathPrefix, path),
      action,
    })
    return this
  }
}

export type TOpenApiServerActionRouter = OpenApiServerActionRouter

export const createOpenApiServerActionRouter = <
  T extends string,
  THandlers extends TAnyZodSafeFunctionHandler,
>(args?: {
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

export function setupApiHandler<
  THandler extends TAnyZodSafeFunctionHandler,
>(
  path: string,
  action: THandler,
) {
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


    // parse the params from the path
    if (path.includes("{")) {
      let basePathSplit = path.split("/")
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

    if (!action) {
      throw new Error("No matching action found")
    }

    if (Object.keys(final).length === 0) {
      return {
        input: undefined,
        params: {},
        searchParams: {},
        action: action,
        body: undefined,
      }
    }

    return {
      input: final,
      params,
      searchParams: searchParamsJson,
      action: action,
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