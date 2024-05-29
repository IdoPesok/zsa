import { NextRequest } from "next/server"

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const mockNextRequest = (args: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  pathname: `/${string}`
  searchParams?: Record<string, string>
  body?: Record<string, any>
  type?: "formData" | "json"
  headers?: Record<string, string>
}) => {
  const data: any = {
    nextUrl: { pathname: args.pathname },
    method: args.method,
  }

  const headers = new Headers()
  for (const [key, value] of Object.entries(args.headers || {})) {
    headers.append(key, value)
  }

  if (args.type === "formData") {
    headers.append("content-type", "application/x-www-form-urlencoded")
  } else {
    headers.append("content-type", "application/json")
  }

  data.headers = headers

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(args.searchParams || {})) {
    searchParams.append(key, value)
  }

  if (args.searchParams) {
    data.nextUrl.searchParams = searchParams
  }

  if (args.body) {
    if (args.type === "formData") {
      const fd = new FormData()
      for (const [key, value] of Object.entries(args.body)) {
        fd.append(key, value)
      }
      data.formData = () => fd
    } else {
      data.json = () => args.body
    }
  }

  return data as unknown as NextRequest
}
