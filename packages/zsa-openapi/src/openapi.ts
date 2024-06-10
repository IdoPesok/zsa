import { type NextRequest } from "next/server"
import { OpenAPIV3 } from "openapi-types"
import { pathToRegexp } from "path-to-regexp"
import { z } from "zod"
import {
  TAnyZodSafeFunctionHandler,
  TOptsSource,
  ZSAResponseMeta,
  canDataBeUndefinedForSchema,
  formDataToJson,
  inferServerActionError,
  inferServerActionInput,
} from "zsa"
import {
  acceptsRequestBody,
  getErrorStatusFromZSAError,
  preparePathForMatching,
} from "./utils"

export type OpenApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

const FORM_DATA_CONTENT_TYPE = "application/x-www-form-urlencoded"
const MULTI_PART_CONTENT_TYPE = "multipart/form-data"
const JSON_CONTENT_TYPE = "application/json"

interface TShapeError<T extends any = unknown> {
  (error: T): any
}

export type OpenApiContentType =
  | typeof FORM_DATA_CONTENT_TYPE
  | typeof JSON_CONTENT_TYPE
  | typeof MULTI_PART_CONTENT_TYPE
  | (string & {})

export interface ApiRouteHandler {
  (request: NextRequest): Promise<Response>
}

/**
 * Store OpenAPI information alongside a server action
 */
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

type TOpenApiSpecs = Omit<OpenApiAction<any>, "path" | "action" | "method">

const standardizePath = (path: string, method: string) => {
  return path.replace(/\{[^}]+\}/g, "{param}") + `<${method}>`
}

/**
 *  Helper function to create a path safely
 */
const createPath = (args: {
  path: string
  method: OpenApiMethod
  pathPrefix?: string | undefined
  actions: OpenApiAction<any>[]
}) => {
  const { path, method, pathPrefix, actions } = args

  let tmp = pathPrefix ? `${pathPrefix}${path}` : path
  if (tmp.endsWith("/") && tmp !== "/") {
    tmp = tmp.slice(0, -1)
  }

  if (tmp.includes(" ")) {
    throw new Error(`Path [${method}]: ${tmp} contains a space`)
  }

  if (tmp.includes("?")) {
    throw new Error(
      `Path [${method}]: ${tmp} contains a question mark. Do not include query params in the path`
    )
  }

  // replace all :param with {param}
  if (tmp.includes(":")) {
    tmp = tmp.replace(/:\w+/g, (match) => `{${match.slice(1)}}`)
  }

  // check for duplicates
  for (const action of actions) {
    // regex replace all {param} with {param}
    const tmpClean = standardizePath(tmp, method)
    const actionPathClean = standardizePath(action.path, action.method)

    if (tmpClean === actionPathClean) {
      throw new Error(`Duplicate path [${method}]: ${tmp} and ${action.path}`)
    }
  }

  return tmp
}

class OpenApiServerActionRouter {
  $INTERNALS: {
    pathPrefix?: string | undefined
    actions: OpenApiAction<any>[]
    defaults?: TOpenApiSpecs
  }

  constructor(opts?: {
    pathPrefix?: string
    actions?: OpenApiAction<any>[]
    defaults?: TOpenApiSpecs
  }) {
    let pathPrefix = opts?.pathPrefix

    if (pathPrefix?.endsWith("/") && pathPrefix !== "/") {
      // make sure the path prefix doesn't end with a slash
      pathPrefix = pathPrefix.slice(0, -1)
    } else if (pathPrefix === "/") {
      // make sure it isn't just a slash
      pathPrefix = ""
    }

    if (opts?.actions) {
      const seen = new Set<string>()
      for (const action of opts.actions) {
        const p = standardizePath(action.path, action.method)
        if (seen.has(p)) {
          throw new Error(`Duplicate path [${action.method}]: ${p}`)
        }
        seen.add(p)
      }
    }

    this.$INTERNALS = {
      pathPrefix,
      actions: opts?.actions || [],
      defaults: opts?.defaults,
    }
  }

  /**
   * Add a server action to the router as a GET route
   *
   * @example
   * ```ts
   * router.get("/posts", getPostsAction, {
   *   tags: ["posts"],
   * })
   * ```
   */
  get<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: TOpenApiSpecs
  ) {
    this.$INTERNALS.actions.push({
      ...(this.$INTERNALS.defaults || {}),
      ...args,
      method: "GET",
      path: createPath({
        path,
        method: "GET",
        actions: this.$INTERNALS.actions,
        pathPrefix: this.$INTERNALS.pathPrefix,
      }),
      action,
    })
    return this
  }

  /**
   * Add a server action to the router as a POST route
   *
   * @example
   * ```ts
   * router.post("/posts", createPostAction, {
   *   tags: ["posts"],
   * })
   * ```
   */
  post<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: TOpenApiSpecs
  ) {
    this.$INTERNALS.actions.push({
      ...(this.$INTERNALS.defaults || {}),
      ...args,
      method: "POST",
      path: createPath({
        path,
        method: "POST",
        actions: this.$INTERNALS.actions,
        pathPrefix: this.$INTERNALS.pathPrefix,
      }),
      action,
    })
    return this
  }

  /**
   * Add a server action to the router as a DELETE route
   *
   * @example
   * ```ts
   * router.delete("/posts/{postId}", deletePostAction, {
   *   tags: ["posts"],
   * })
   * ```
   */
  delete<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: TOpenApiSpecs
  ) {
    this.$INTERNALS.actions.push({
      ...(this.$INTERNALS.defaults || {}),
      ...args,
      method: "DELETE",
      path: createPath({
        path,
        method: "DELETE",
        actions: this.$INTERNALS.actions,
        pathPrefix: this.$INTERNALS.pathPrefix,
      }),
      action,
    })
    return this
  }

  /**
   * Add a server action to the router as a PUT route
   *
   * @example
   * ```ts
   * router.put("/posts/{postId}", updatePostAction, {
   *   tags: ["posts"],
   * })
   * ```
   */
  put<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: TOpenApiSpecs
  ) {
    this.$INTERNALS.actions.push({
      ...(this.$INTERNALS.defaults || {}),
      ...args,
      method: "PUT",
      path: createPath({
        path,
        method: "PUT",
        actions: this.$INTERNALS.actions,
        pathPrefix: this.$INTERNALS.pathPrefix,
      }),
      action,
    })
    return this
  }

  /**
   * Add a server action to the router as a PATCH route
   *
   * @example
   * ```ts
   * router.patch("/posts/{postId}", updatePostAction, {
   *   tags: ["posts"],
   * })
   * ```
   */
  patch<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: TOpenApiSpecs
  ) {
    this.$INTERNALS.actions.push({
      ...(this.$INTERNALS.defaults || {}),
      ...args,
      method: "PATCH",
      path: createPath({
        path,
        method: "PATCH",
        actions: this.$INTERNALS.actions,
        pathPrefix: this.$INTERNALS.pathPrefix,
      }),
      action,
    })
    return this
  }

  /**
   * Add all server actions to the router as GET, POST, DELETE, PUT, and PATCH routes
   *
   * @example
   * ```ts
   * router.all("/posts", createPostAction, {
   *   tags: ["posts"],
   * })
   * ```
   */
  all<THandler extends TAnyZodSafeFunctionHandler>(
    path: `/${string}`,
    action: THandler,
    args?: TOpenApiSpecs
  ) {
    for (const func of [
      this.get,
      this.post,
      this.delete,
      this.put,
      this.patch,
    ]) {
      func.call(this, path, action, args)
    }
    return this
  }
}

export type TOpenApiServerActionRouter = OpenApiServerActionRouter

/**
 * Create a router and add server actions to it
 *
 * @example
 * ```ts
 * const router = createOpenApiServerActionRouter()
 *   .get("/posts", getPostsAction)
 *   .post("/posts", createPostAction)
 *   .delete("/posts/{postId}", deletePostAction)
 *   .put("/posts/{postId}", updatePostAction)
 *   .patch("/posts/{postId}", updatePostAction)
 * ```
 */
export const createOpenApiServerActionRouter = (args?: {
  /**
   * The path prefix for the router
   *
   * @example
   * ```tsx
   * const router = createOpenApiServerActionRouter({ pathPrefix: "/api" })
   *   .get("/posts", getPostsAction)
   * ```
   *
   * This will match the path `/api/posts`
   */
  pathPrefix?: `/${string}`
  /**
   * Add default OpenAPI specs to all actions
   */
  defaults?: TOpenApiSpecs
  /**
   * Extend the router with other routers
   */
  extend?: OpenApiServerActionRouter | Array<OpenApiServerActionRouter>
}): OpenApiServerActionRouter => {
  let actions: OpenApiAction<any>[] = []

  if (args && args.extend) {
    let extend: Array<OpenApiServerActionRouter> = Array.isArray(args.extend)
      ? args.extend
      : [args.extend]

    for (const router of extend) {
      for (const action of router.$INTERNALS.actions) {
        actions.push({
          ...(args.defaults || {}),
          ...action,
        })
      }
    }
  }

  return new OpenApiServerActionRouter({
    ...args,
    actions,
  })
}

const getDataFromRequest = async (
  request: NextRequest,
  inputSchema: z.ZodType,
  contentTypes?: OpenApiContentType[]
) => {
  // get the search params
  const searchParams = request.nextUrl.searchParams
  const searchParamsJson =
    searchParams && "entries" in searchParams
      ? Object.fromEntries(searchParams.entries())
      : {}

  const headers = new Headers(request.headers)
  let data: Object | undefined = undefined

  const suppportedContentTypes = contentTypes || ["application/json"]
  const requestContentType = headers.get("content-type")

  // make sure the content type is supported
  const foundContentType = suppportedContentTypes.find((contentType) => {
    return requestContentType?.startsWith(contentType)
  })
  if (!foundContentType) {
    return {
      data: undefined,
      searchParamsJson,
      requestError: "UNSUPPORTED_CONTENT_TYPE" as const,
    }
  }

  // if it has a body
  if (acceptsRequestBody(request.method)) {
    try {
      if (
        (suppportedContentTypes.includes(FORM_DATA_CONTENT_TYPE) &&
          requestContentType?.startsWith(FORM_DATA_CONTENT_TYPE)) ||
        (suppportedContentTypes.includes(MULTI_PART_CONTENT_TYPE) &&
          requestContentType?.startsWith(MULTI_PART_CONTENT_TYPE))
      ) {
        // if its form data
        const formData = await request.formData()
        data = formDataToJson(formData, inputSchema)
      } else if (
        suppportedContentTypes.includes(JSON_CONTENT_TYPE) &&
        requestContentType?.startsWith(JSON_CONTENT_TYPE)
      ) {
        // if its json
        data = await request.json()
      }
    } catch (err) {
      data = undefined
    }
  }

  return {
    data,
    searchParamsJson,
  }
}

const getResponseFromAction = async <
  TAction extends TAnyZodSafeFunctionHandler,
>(
  request: NextRequest,
  action: TAction,
  input: inferServerActionInput<TAction>,
  requestError: Awaited<ReturnType<typeof getDataFromRequest>>["requestError"],
  shapeError?: TShapeError
) => {
  // handle unsupported content type
  if (requestError === "UNSUPPORTED_CONTENT_TYPE") {
    return new Response(JSON.stringify({ error: "Unsupported Media Type" }), {
      status: 415,
    })
  }

  const responseMeta = new ZSAResponseMeta()

  const stringifyIfNeeded = (data: any) =>
    typeof data === "string" ? data : JSON.stringify(data)

  try {
    const [data, err] = await action(input, undefined, {
      request: request,
      responseMeta,
      source: new TOptsSource(() => true),
    })

    if (err instanceof Response) {
      return err
    }

    if (data instanceof Response) {
      return data
    }

    if (err) {
      throw err
    }

    // set default content type
    if (
      typeof data === "object" &&
      responseMeta.headers.get("content-type") === null
    ) {
      responseMeta.headers.set("content-type", "application/json")
    } else if (
      typeof data === "string" &&
      responseMeta.headers.get("content-type") === null
    ) {
      responseMeta.headers.set("content-type", "text/plain")
    }

    return new Response(stringifyIfNeeded(data), {
      status: responseMeta.statusCode,
      headers: responseMeta.headers,
    })
  } catch ($error: any) {
    let error = $error

    // if the error is a redirect, throw it
    if (
      typeof error === "object" &&
      (error.message === "NEXT_REDIRECT" || error.message === "NEXT_NOT_FOUND")
    ) {
      throw error
    }

    if (shapeError) {
      try {
        error = shapeError(error)
      } catch (error: any) {
        error = $error
      }
    }

    if (error instanceof Response) {
      return error
    }

    let status = getErrorStatusFromZSAError(error)

    responseMeta.headers.set(
      "content-type",
      typeof error === "string" ? "text/plain" : "application/json"
    )

    return new Response(stringifyIfNeeded(error), {
      status,
      headers: responseMeta.headers,
    })
  }
}

/**
 * Setup API route handlers for Next JS given an OpenAPI server action router
 *
 * @example
 * ```ts
 * const router = createOpenApiServerActionRouter()
 *   .get("/posts", getPostsAction)
 *   .post("/posts", createPostAction)
 *   .delete("/posts/{postId}", deletePostAction)
 *   .put("/posts/{postId}", updatePostAction)
 *   .patch("/posts/{postId}", updatePostAction)
 * export const { GET, POST, PUT, DELETE, PATCH } = createRouteHandlers(router)
 * ```
 */
export const createRouteHandlers = (
  router: TOpenApiServerActionRouter,
  opts?: {
    shapeError?: TShapeError<any>
  }
) => {
  const parseRequest = async (
    request: NextRequest
  ): Promise<null | {
    input: Record<string, any> | undefined
    params: Record<string, string>
    searchParams: Record<string, string>
    action: TAnyZodSafeFunctionHandler
    body: Record<string, any> | undefined
    requestError: Awaited<ReturnType<typeof getDataFromRequest>>["requestError"]
  }> => {
    try {
      // find the matching action from the router
      const foundMatch = router.$INTERNALS.actions.find((action) => {
        if (action.method !== request.method) {
          return false
        }

        if (action.path === request.nextUrl.pathname) {
          return true
        }

        if (!action.path.includes("{") || !action.path.includes("}"))
          return false

        const re = pathToRegexp(preparePathForMatching(action.path))
        const match = re.exec(
          request.nextUrl.pathname.split("?")[0] || "NEVER_MATCH"
        )

        if (!match) return false

        return true
      })

      if (!foundMatch) return null

      const inputSchema = await foundMatch.action(undefined, undefined, {
        returnInputSchema: true,
        source: new TOptsSource(() => true),
      })

      const { data, searchParamsJson, requestError } = await getDataFromRequest(
        request,
        inputSchema,
        foundMatch.contentTypes
      )

      const params: Record<string, string> = {}

      // parse the params from the path
      if (foundMatch.path.includes("{")) {
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

      if (
        Object.keys(final).length === 0 &&
        canDataBeUndefinedForSchema(inputSchema)
      ) {
        return {
          input: undefined,
          params: {},
          searchParams: {},
          action: foundMatch.action,
          body: undefined,
          requestError: requestError,
        }
      }

      return {
        input: final,
        params,
        searchParams: searchParamsJson,
        action: foundMatch.action,
        body: data,
        requestError: requestError,
      }
    } catch (error: unknown) {
      return null
    }
  }

  const handler: ApiRouteHandler = async (request: NextRequest) => {
    const parsedData = await parseRequest(request)
    if (!parsedData) return new Response("", { status: 404 })

    return await getResponseFromAction(
      request,
      parsedData.action,
      parsedData.input,
      parsedData.requestError,
      opts?.shapeError
    )
  }

  return {
    GET: handler,
    POST: handler,
    DELETE: handler,
    PUT: handler,
    PATCH: handler,
  }
}

/**
 * Create an API route handler for Next JS given a server action
 *
 * Exports `GET`, `POST`, `PUT`, `DELETE`, and `PATCH` functions.
 *
 * @example
 * ```ts
 * export const { GET } = setupApiHandler("/posts", getPostsAction)
 * ```
 *
 * @example
 * ```ts
 * export const { POST } = setupApiHandler("/posts", createPostAction)
 * ```
 *
 * @example
 * ```ts
 * export const { PUT } = setupApiHandler("/posts/{postId}", updatePostAction)
 * ```
 */
export function setupApiHandler<THandler extends TAnyZodSafeFunctionHandler>(
  path: `/${string}`,
  action: THandler,
  opts?: {
    shapeError?: TShapeError<inferServerActionError<THandler>>
  }
) {
  const router = createOpenApiServerActionRouter()
    .get(path, action)
    .post(path, action)
    .delete(path, action)
    .put(path, action)
    .patch(path, action)

  return createRouteHandlers(router, opts as any)
}

/**
 * Create an API route handler for Next JS given a server action
 *
 * Exports `GET`, `POST`, `PUT`, `DELETE`, and `PATCH` functions.
 *
 * @example
 * ```ts
 * export const { GET } = createRouteHandlersForAction(getPostAction)
 * ```
 *
 * @example
 * ```ts
 * export const { POST } = createRouteHandlersForAction(createPostAction)
 * ```
 *
 * @example
 * ```ts
 * export const { PUT } = createRouteHandlersForAction(updatePostAction)
 * ```
 */
export function createRouteHandlersForAction<
  THandler extends TAnyZodSafeFunctionHandler,
>(
  action: THandler,
  opts?: {
    contentTypes?: OpenApiContentType[]
    shapeError?: TShapeError<inferServerActionError<THandler>>
  }
) {
  const handler: ApiRouteHandler = async (
    request: NextRequest,
    args?: { params?: Record<string, string> }
  ) => {
    const inputSchema = (await action(undefined, undefined, {
      returnInputSchema: true,
      source: new TOptsSource(() => true),
    })) as any

    const { data, searchParamsJson, requestError } = await getDataFromRequest(
      request,
      inputSchema,
      opts?.contentTypes
    )

    let input: any = {
      ...(data || {}),
      ...(searchParamsJson || {}),
      ...(args?.params || {}),
    }

    if (
      Object.keys(input).length === 0 &&
      canDataBeUndefinedForSchema(inputSchema)
    ) {
      input = undefined
    }

    return await getResponseFromAction(
      request,
      action,
      input,
      requestError,
      opts?.shapeError as any
    )
  }

  return {
    GET: handler,
    POST: handler,
    DELETE: handler,
    PUT: handler,
    PATCH: handler,
  }
}
