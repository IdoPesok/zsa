import { NextRequest } from "next/server"

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const mockNextRequest = (args: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  pathname: `/${string}`
  searchParams?: Record<string, string>
  body?: Record<string, any>
  formData?: FormData
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

  if (args.formData !== undefined) {
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

  if (args.formData) {
    data.formData = () => args.formData
  } else if (args.body) {
    data.json = () => args.body
  }

  return data as unknown as NextRequest
}
