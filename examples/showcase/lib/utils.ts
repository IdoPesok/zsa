import clsx, { ClassValue } from "clsx"
import { customAlphabet } from "nanoid"
import {
  createServerActionsKeyFactory,
  setupServerActionHooks,
} from "server-actions-wrapper"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
)
export function newId(len: number = 16): string {
  return nanoid(len)
}

export const LETTERS_LOWER = "abcdefghijklmnopqrstuvwxyz"
export const LETTERS_UPPER = LETTERS_LOWER.toUpperCase()
export const NUMBERS = Array.from(Array(1000).keys()).join("")

export const dashCase = (str: string) =>
  str.replace(/([A-Z])/g, (g) => `-${g[0]!.toLowerCase()}`)

export const toTitleCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const camelCaseToTitleCase = (str: string) => {
  // take a camel case string like generateImageUrl and return Generate Image Url
  const words = str.split(/(?=[A-Z])/)
  return words
    .map((word) => toTitleCase(word))
    .join(" ")
    .replaceAll("_", " ")
}

export function base64Encode(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64")
}

export function base64Decode(base64Str: string): string {
  return Buffer.from(base64Str, "base64").toString("utf-8")
}

export const logJSON = (data: any, prefix = "") => {
  console.log(prefix, JSON.stringify(data, null, 2), "\n")
}

export function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
}

export const ActionKeyFactory = createServerActionsKeyFactory({
  getRandomNumber: () => ["getRandomNumber"],
  posts: () => ["posts"],
  postsList: () => ["posts", "list"],
  postDetails: (id: string) => ["posts", "details", id],
})

export const { useServerActionsUtils, useServerAction } =
  setupServerActionHooks(ActionKeyFactory)
