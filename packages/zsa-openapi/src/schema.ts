/**
 * ATTRIBUTION
 *
 * This file is from the awesome library trpc-openapi.
 *
 * Github: https://github.com/jlalmes/trpc-openapi
 * File: https://github.com/jlalmes/trpc-openapi/blob/master/src/generator/schema.ts
 * Author: https://twitter.com/jlalmes
 *
 * If you are using tRPC, check it out!
 */

import { OpenAPIV3 } from "openapi-types"
import { z } from "zod"
import zodToJsonSchema from "zod-to-json-schema"
import {
  ZSAError,
  instanceofZodTypeLikeVoid,
  instanceofZodTypeObject,
  unwrapZodType,
} from "zsa"
import { OpenApiContentType } from "./openapi"
import {
  instanceofZodType,
  instanceofZodTypeCoercible,
  instanceofZodTypeLikeString,
  instanceofZodTypeOptional,
  zodSupportsCoerce,
} from "./zod"

const zodSchemaToOpenApiSchemaObject = (
  zodSchema: z.ZodType
): OpenAPIV3.SchemaObject => {
  return zodToJsonSchema(zodSchema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as any
}

export const getParameterObjects = (
  schema: unknown,
  pathParameters: string[],
  inType: "all" | "path" | "query",
  example: Record<string, any> | undefined
): OpenAPIV3.ParameterObject[] | undefined => {
  if (!instanceofZodType(schema)) {
    throw new ZSAError(
      "INTERNAL_SERVER_ERROR",
      "Input parser expects a Zod validator"
    )
  }

  const isRequired = !schema.isOptional()
  const unwrappedSchema = unwrapZodType(schema, true)

  if (
    pathParameters.length === 0 &&
    instanceofZodTypeLikeVoid(unwrappedSchema)
  ) {
    return undefined
  }

  if (!instanceofZodTypeObject(unwrappedSchema)) {
    throw new ZSAError(
      "INTERNAL_SERVER_ERROR",
      "Input parser must be a ZodObject"
    )
  }

  const shape = unwrappedSchema.shape
  const shapeKeys = Object.keys(shape)

  for (const pathParameter of pathParameters) {
    if (!shapeKeys.includes(pathParameter)) {
      throw new ZSAError(
        "INTERNAL_SERVER_ERROR",
        `Input parser expects key from path: "${pathParameter}"`
      )
    }
  }

  return shapeKeys
    .filter((shapeKey) => {
      const isPathParameter = pathParameters.includes(shapeKey)
      if (inType === "path") {
        return isPathParameter
      } else if (inType === "query") {
        return !isPathParameter
      }
      return true
    })
    .map((shapeKey) => {
      let shapeSchema = shape[shapeKey]!
      const isShapeRequired = !shapeSchema.isOptional()
      const isPathParameter = pathParameters.includes(shapeKey)

      if (!instanceofZodTypeLikeString(shapeSchema)) {
        if (zodSupportsCoerce) {
          if (!instanceofZodTypeCoercible(shapeSchema)) {
            throw new ZSAError(
              "INTERNAL_SERVER_ERROR",
              `Input parser key: "${shapeKey}" must be ZodString`
            )
          }
        } else {
          throw new ZSAError(
            "INTERNAL_SERVER_ERROR",
            `Input parser key: "${shapeKey}" must be ZodString`
          )
        }
      }

      if (instanceofZodTypeOptional(shapeSchema)) {
        if (isPathParameter) {
          throw new ZSAError(
            "INTERNAL_SERVER_ERROR",
            `Path parameter: "${shapeKey}" must not be optional`
          )
        }
        shapeSchema = shapeSchema.unwrap()
      }

      const { description, ...openApiSchemaObject } =
        zodSchemaToOpenApiSchemaObject(shapeSchema)

      return {
        name: shapeKey,
        in: isPathParameter ? "path" : "query",
        required: isPathParameter || (isRequired && isShapeRequired),
        schema: openApiSchemaObject,
        description: description,
        example: example?.[shapeKey],
      }
    })
}

export const getRequestBodyObject = (
  schema: unknown,
  pathParameters: string[],
  contentTypes: OpenApiContentType[],
  example: Record<string, any> | undefined
): OpenAPIV3.RequestBodyObject | undefined => {
  if (!instanceofZodType(schema)) {
    throw new ZSAError(
      "INTERNAL_SERVER_ERROR",
      "Input parser expects a Zod validator (request body)"
    )
  }

  const isRequired = !schema.isOptional()
  const unwrappedSchema = unwrapZodType(schema, true)

  if (
    pathParameters.length === 0 &&
    instanceofZodTypeLikeVoid(unwrappedSchema)
  ) {
    return undefined
  }

  if (!instanceofZodTypeObject(unwrappedSchema)) {
    throw new ZSAError(
      "INTERNAL_SERVER_ERROR",
      "Input parser must be a ZodObject"
    )
  }

  // remove path parameters
  const mask: Record<string, true> = {}
  const dedupedExample = example && { ...example }
  pathParameters.forEach((pathParameter) => {
    mask[pathParameter] = true
    if (dedupedExample) {
      delete dedupedExample[pathParameter]
    }
  })
  const dedupedSchema = unwrappedSchema.omit(mask)

  // if all keys are path parameters
  if (
    pathParameters.length > 0 &&
    Object.keys(dedupedSchema.shape).length === 0
  ) {
    return undefined
  }

  const openApiSchemaObject = zodSchemaToOpenApiSchemaObject(dedupedSchema)
  const content: OpenAPIV3.RequestBodyObject["content"] = {}
  for (const contentType of contentTypes) {
    content[contentType] = {
      schema: openApiSchemaObject,
      example: dedupedExample,
    }
  }

  return {
    required: isRequired,
    content,
  }
}

export const errorResponseObject: OpenAPIV3.ResponseObject = {
  description: "Error response",
  content: {
    "application/json": {
      schema: zodSchemaToOpenApiSchemaObject(
        z.object({
          message: z.string(),
          code: z.string(),
          issues: z.array(z.object({ message: z.string() })).optional(),
        })
      ),
    },
  },
}

export const getResponsesObject = (
  schema: unknown,
  example: Record<string, any> | undefined,
  headers:
    | Record<string, OpenAPIV3.HeaderObject | OpenAPIV3.ReferenceObject>
    | undefined
): OpenAPIV3.ResponsesObject => {
  if (schema !== undefined && !instanceofZodType(schema)) {
    throw new ZSAError(
      "INTERNAL_SERVER_ERROR",
      "Output parser must be a ZodObject"
    )
  }

  const successResponseObject: OpenAPIV3.ResponseObject = {
    description: "Successful response",
    headers: headers,
    content: {
      "application/json": {
        schema: zodSchemaToOpenApiSchemaObject(schema || z.unknown()),
        example,
      },
    },
  }

  return {
    200: successResponseObject,
    default: {
      $ref: "#/components/responses/error",
    },
  }
}
