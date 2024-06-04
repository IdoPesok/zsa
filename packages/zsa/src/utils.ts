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
