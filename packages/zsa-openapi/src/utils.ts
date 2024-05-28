export const acceptsRequestBody = (method: string) => {
  if (method === "GET" || method === "DELETE") {
    return false
  }
  return true
}

export const normalizePath = (path: string) => {
  return `/${path.replace(/^\/|\/$/g, "")}`
}

export const getPathParameters = (path: string) => {
  return Array.from(path.matchAll(/\{(.+?)\}/g)).map(([_, key]) => key!)
}

export const preparePathForMatching = (path: string) => {
  return path.replace(/\{/g, ":").replace(/\}/g, "")
}

export const getPathRegExp = (path: string) => {
  const groupedExp = path.replace(
    /\{(.+?)\}/g,
    (_, key: string) => `(?<${key}>[^/]+)`
  )
  return new RegExp(`^${groupedExp}$`, "i")
}

export const getErrorStatusFromZSAError = (error: unknown) => {
  if (!error || typeof error !== "object") return 500

  if (!("code" in error)) {
    return 500
  }

  switch (error.code) {
    case "INTERNAL_SERVER_ERROR":
      return 500
    case "INPUT_PARSE_ERROR":
      return 400
    case "OUTPUT_PARSE_ERROR":
      return 500
    case "ERROR":
      return 500
    case "NOT_AUTHORIZED":
      return 401
    case "TIMEOUT":
      return 408
    default:
      return 500
  }
}
