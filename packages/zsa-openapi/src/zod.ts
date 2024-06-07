/**
 * ATTRIBUTION
 *
 * This helper functions are from the awesome library trpc-openapi.
 *
 * Github: https://github.com/jlalmes/trpc-openapi
 * File: https://github.com/jlalmes/trpc-openapi/blob/master/src/utils/zod.ts
 * Author: https://twitter.com/jlalmes
 *
 * If you are using tRPC, check it out!
 */

import { z } from "zod"
import { instanceofZodTypeKind, unwrapZodType } from "zsa"

export const instanceofZodType = (type: any): type is z.ZodTypeAny => {
  return !!type?._def?.typeName
}

export const instanceofZodTypeOptional = (
  type: z.ZodTypeAny
): type is z.ZodOptional<z.ZodTypeAny> => {
  return instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodOptional)
}

type NativeEnumType = {
  [k: string]: string | number
  [nu: number]: string
}

export type ZodTypeLikeString =
  | z.ZodString
  | z.ZodOptional<ZodTypeLikeString>
  | z.ZodDefault<ZodTypeLikeString>
  | z.ZodEffects<ZodTypeLikeString, unknown, unknown>
  | z.ZodUnion<[ZodTypeLikeString, ...ZodTypeLikeString[]]>
  | z.ZodIntersection<ZodTypeLikeString, ZodTypeLikeString>
  | z.ZodLazy<ZodTypeLikeString>
  | z.ZodLiteral<string>
  | z.ZodEnum<[string, ...string[]]>
  | z.ZodNativeEnum<NativeEnumType>

export const instanceofZodTypeLikeString = (
  _type: z.ZodTypeAny
): _type is ZodTypeLikeString => {
  const type = unwrapZodType(_type, false)

  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodEffects)) {
    if (type._def.effect.type === "preprocess") {
      return true
    }
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodUnion)) {
    return !type._def.options.some(
      (option) => !instanceofZodTypeLikeString(option)
    )
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodIntersection)) {
    return (
      instanceofZodTypeLikeString(type._def.left) &&
      instanceofZodTypeLikeString(type._def.right)
    )
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodLiteral)) {
    return typeof type._def.value === "string"
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodEnum)) {
    return true
  }
  if (instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodNativeEnum)) {
    return !Object.values(type._def.values).some(
      (value) => typeof value === "number"
    )
  }
  return instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodString)
}

export const zodSupportsCoerce = "coerce" in z

export type ZodTypeCoercible =
  | z.ZodNumber
  | z.ZodBoolean
  | z.ZodBigInt
  | z.ZodDate

export const instanceofZodTypeCoercible = (
  _type: z.ZodTypeAny
): _type is ZodTypeCoercible => {
  const type = unwrapZodType(_type, false)
  return (
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodNumber) ||
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodBoolean) ||
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodBigInt) ||
    instanceofZodTypeKind(type, z.ZodFirstPartyTypeKind.ZodDate)
  )
}
