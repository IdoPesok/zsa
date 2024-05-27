/**
 * An interface representing a NextRequest type
 *
 * https://nextjs.org/docs/app/api-reference/functions/next-request
 */

export interface DomainLocale {
  defaultLocale: string
  domain: string
  http?: true
  locales?: string[]
}

interface NextURL {
  buildId?: string | undefined
  locale: string
  defaultLocale?: string | undefined
  domainLocale?: DomainLocale | undefined
  searchParams: URLSearchParams
  host: string
  hostname: string
  port: string
  protocol: string
  href: string
  origin: string
  pathname: string
  hash: string
  search: string
  password: string
  username: string
  basePath: string
}

type RequestCookie = {
  name: string
  value: string
}

interface RequestCookies {
  size: number
  get(...args: [name: string] | [RequestCookie]): RequestCookie | undefined
  getAll(...args: [name: string] | [RequestCookie] | []): RequestCookie[]
  has(name: string): boolean
  set(...args: [key: string, value: string] | [options: RequestCookie]): this
  delete(names: string | string[]): boolean | boolean[]
  clear(): this
  toString(): string
}

export interface NextRequest extends Request {
  geo:
    | {
        city?: string | undefined
        country?: string | undefined
        region?: string | undefined
        latitude?: string | undefined
        longitude?: string | undefined
      }
    | undefined
  ip: string | undefined
  nextUrl: NextURL
  url: string
  cookies: RequestCookies
}
