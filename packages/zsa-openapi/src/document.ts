/**
 * ATTRIBUTION
 *
 * This file is a modified version of functions from the awesome library trpc-openapi.
 *
 * Github: https://github.com/jlalmes/trpc-openapi
 * Author: https://twitter.com/jlalmes
 *
 * If you are using tRPC, check it out!
 */

import { OpenAPIV3 } from "openapi-types"
import { z } from "zod"
import { TOptsSource, ZSAError } from "zsa"
import { TOpenApiServerActionRouter } from "./openapi"
import {
  errorResponseObject,
  getParameterObjects,
  getRequestBodyObject,
  getResponsesObject,
} from "./schema"
import { acceptsRequestBody, getPathParameters, normalizePath } from "./utils"

export const openApiVersion = "3.0.3"

export type GenerateOpenApiDocumentOptions = {
  title: string
  description?: string
  version: string
  baseUrl: string
  docsUrl?: string
  tags?: string[]
  securitySchemes?: OpenAPIV3.ComponentsObject["securitySchemes"]
}

const getOpenApiPathsObject = async (
  router: TOpenApiServerActionRouter,
  securitySchemeNames: string[]
): Promise<OpenAPIV3.PathsObject> => {
  const pathsObject: OpenAPIV3.PathsObject = {}

  for (const action of router.$INTERNALS.actions) {
    if (action.enabled === false) continue

    try {
      const {
        method,
        protect,
        path: $path,
        summary,
        description,
        tags,
        headers,
        contentTypes: $contentTypes,
        example,
        responseHeaders,
        deprecated,
      } = action

      const path = normalizePath($path)
      const pathParameters = getPathParameters(path)
      const headerParameters =
        headers?.map((header) => ({ ...header, in: "header" })) || []

      const httpMethod = OpenAPIV3.HttpMethods[method]
      if (!httpMethod) {
        throw new ZSAError(
          "INTERNAL_SERVER_ERROR",
          "Method must be GET, POST, PATCH, PUT or DELETE"
        )
      }

      if (pathsObject[path]?.[httpMethod]) {
        throw new ZSAError(
          "INTERNAL_SERVER_ERROR",
          "Duplicate procedure defined for route " + method + " " + path
        )
      }

      const contentTypes = $contentTypes || ["application/json"]
      if (contentTypes.length === 0) {
        throw new ZSAError(
          "INTERNAL_SERVER_ERROR",
          "At least one content type must be specified"
        )
      }

      const inputParser = await action.action(undefined, undefined, {
        returnInputSchema: true,
        source: new TOptsSource(() => true),
      })
      let outputParser = (await action.action(undefined, undefined, {
        returnOutputSchema: true,
        source: new TOptsSource(() => true),
      })) as any

      if (outputParser instanceof z.ZodUndefined || !outputParser) {
        outputParser = z.unknown()
      }

      pathsObject[path] = {
        ...pathsObject[path],
        [httpMethod]: {
          operationId: path.replace(/\./g, "-"),
          summary,
          description,
          tags: tags,
          security: protect
            ? securitySchemeNames.map((name) => ({ [name]: [] }))
            : undefined,
          ...(acceptsRequestBody(method)
            ? {
                requestBody: getRequestBodyObject(
                  inputParser,
                  pathParameters,
                  contentTypes,
                  example?.request
                ),
                parameters: [
                  ...headerParameters,
                  ...(getParameterObjects(
                    inputParser,
                    pathParameters,
                    "path",
                    example?.request
                  ) || []),
                ],
              }
            : {
                requestBody: undefined,
                parameters: [
                  ...headerParameters,
                  ...(getParameterObjects(
                    inputParser,
                    pathParameters,
                    "all",
                    example?.request
                  ) || []),
                ],
              }),
          responses: getResponsesObject(
            outputParser,
            example?.response,
            responseHeaders
          ),
          ...(deprecated ? { deprecated: deprecated } : {}),
        },
      }
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      error.message = `[${action.path}] - ${error.message}`
      throw error
    }
  }

  return pathsObject
}

export const generateOpenApiDocument = async (
  router: TOpenApiServerActionRouter,
  opts: GenerateOpenApiDocumentOptions
): Promise<OpenAPIV3.Document> => {
  const securitySchemes = opts.securitySchemes || {
    Authorization: {
      type: "http",
      scheme: "bearer",
    },
  }

  return {
    openapi: openApiVersion,
    info: {
      title: opts.title,
      description: opts.description,
      version: opts.version,
    },
    servers: [
      {
        url: opts.baseUrl,
      },
    ],
    paths: await getOpenApiPathsObject(router, Object.keys(securitySchemes)),
    components: {
      securitySchemes,
      responses: {
        error: errorResponseObject,
      },
    },
    tags: opts.tags?.map((tag) => ({ name: tag })),
    externalDocs: opts.docsUrl ? { url: opts.docsUrl } : undefined,
  }
}
