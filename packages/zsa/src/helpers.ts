import z from "zod"
import { ZSAError } from "./errors"

async function parser<T extends z.ZodType>(
  schema: T,
  data: unknown,
  type: "INPUT_PARSE_ERROR" | "OUTPUT_PARSE_ERROR"
) {
  const safe = await schema.safeParseAsync(data)

  if (!safe.success) {
    const flattenedErrors = safe.error.flatten()
    const formattedErrors = safe.error.format()
    const key =
      type === "INPUT_PARSE_ERROR" ? "inputParseErrors" : "outputParseErrors"

    throw new ZSAError(type, safe.error, {
      [key]: {
        fieldErrors: flattenedErrors?.fieldErrors,
        formErrors: flattenedErrors?.formErrors,
        formattedErrors: formattedErrors,
      },
    })
  }

  return safe.data
}

export async function zsaParseInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): Promise<z.infer<T>> {
  return await parser(schema, data, "INPUT_PARSE_ERROR")
}

export async function zsaParseOutput<T extends z.ZodType>(
  schema: T,
  data: unknown
): Promise<z.infer<T>> {
  return await parser(schema, data, "OUTPUT_PARSE_ERROR")
}
