import { z } from "zod"

export const instanceofZodTypeKind = <Z extends z.ZodFirstPartyTypeKind>(
  type: z.ZodTypeAny,
  zodTypeKind: Z
): type is InstanceType<(typeof z)[Z]> => {
  return type?._def?.typeName === zodTypeKind
}

export const unwrapZodType = (
  type: z.ZodTypeAny,
  unwrapPreprocess: boolean
): z.ZodTypeAny => {
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodOptional)) {
    return unwrapZodType(type.unwrap(), unwrapPreprocess)
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodDefault)) {
    return unwrapZodType(type.removeDefault(), unwrapPreprocess)
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodLazy)) {
    return unwrapZodType(type._def.getter(), unwrapPreprocess)
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodEffects)) {
    if (type._def.effect.type === "refinement") {
      return unwrapZodType(type._def.schema, unwrapPreprocess)
    }
    if (type._def.effect.type === "transform") {
      return unwrapZodType(type._def.schema, unwrapPreprocess)
    }
    if (unwrapPreprocess && type._def.effect.type === "preprocess") {
      return unwrapZodType(type._def.schema, unwrapPreprocess)
    }
  }
  return type
}

export const instanceofZodTypeObject = (
  type: z.ZodTypeAny
): type is z.ZodObject<z.ZodRawShape> => {
  return instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodObject)
}

export const instanceofZodTypeArray = (
  type: z.ZodTypeAny
): type is z.ZodArray<z.ZodTypeAny> => {
  return instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodArray)
}

export const isKeyAnArrayInZodSchema = (key: string, schema: z.ZodTypeAny) => {
  const unwrapped = unwrapZodType(schema, true)
  const isObject = instanceofZodTypeObject(unwrapped)

  if (!isObject) return false

  const shape = unwrapped.shape

  if (!(key in shape)) return false

  const value = shape[key]

  if (!value) return false

  const unwrappedValue = unwrapZodType(value, true)
  const isArray = instanceofZodTypeArray(unwrappedValue)

  return isArray
}

/**
 * Convert a FormData object into a JSON object.
 * We use this method to return a zod schema values as JSON
 * When returned in a server action data must be serializable.
 * File inputs are not serialiable so when there is a validation
 * error we do clean up of those values
 *
 * Docs:
 * https://react.dev/reference/rsc/use-server#serializable-parameters-and-return-values
 */
export const formDataToJson = ({
  formData,
  inputSchema,
  safeValue = false
}: {
  formData: FormData,
  inputSchema: z.ZodType,
  safeValue?: boolean
}) => {
  const json: Record<string, any> = {}

  formData.forEach((val, key) => {
    // File values can't be serialized into JSON
    const value = safeValue && val instanceof Blob ? undefined : val
    const isArraySchema = isKeyAnArrayInZodSchema(key, inputSchema)

    // Reflect.has in favor of: object.hasOwnProperty(key)
    if (!Reflect.has(json, key)) {
      json[key] = isArraySchema ? [value] : value
      return
    }

    if (!Array.isArray(json[key])) {
      json[key] = [json[key]]
    }
    json[key].push(value)
  })

  return json
}

export const addToNullishArray = (
  array: Array<any> | undefined,
  value: any | undefined
) => {
  if (!array && !value) return undefined
  if (!value) return array

  const temp = [...(array || [])]
  temp.push(value)

  return temp
}

export const mergeArraysAndRemoveDuplicates = <T>(
  array1: Array<T> | undefined,
  array2: Array<T> | undefined
) => {
  if (!array1 && !array2) return undefined
  if (!array2) return array1
  if (!array1) return array2

  const temp = [...(array1 || []), ...(array2 || [])]
  return [...new Set(temp)]
}

export type ZodTypeLikeVoid = z.ZodVoid | z.ZodUndefined | z.ZodNever

export const instanceofZodTypeLikeVoid = (
  type: z.ZodTypeAny
): type is ZodTypeLikeVoid => {
  return (
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodVoid) ||
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodUndefined) ||
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodNever)
  )
}

export const canDataBeUndefinedForSchema = (
  schema: z.ZodType | undefined
): boolean => {
  if (!schema) return true

  if (instanceofZodTypeLikeVoid(schema)) return true

  if (instanceofZodTypeKind(schema, z.ZodFirstPartyTypeKind.ZodOptional)) {
    return true
  }
  if (instanceofZodTypeKind(schema, z.ZodFirstPartyTypeKind.ZodDefault)) {
    return true
  }

  if (instanceofZodTypeKind(schema, z.ZodFirstPartyTypeKind.ZodLazy)) {
    return canDataBeUndefinedForSchema(schema._def.getter())
  }

  if (instanceofZodTypeKind(schema, z.ZodFirstPartyTypeKind.ZodEffects)) {
    if (schema._def.effect.type === "refinement") {
      return canDataBeUndefinedForSchema(schema._def.schema)
    }
    if (schema._def.effect.type === "transform") {
      return canDataBeUndefinedForSchema(schema._def.schema)
    }
    if (schema._def.effect.type === "preprocess") {
      return canDataBeUndefinedForSchema(schema._def.schema)
    }
  }

  return false
}
