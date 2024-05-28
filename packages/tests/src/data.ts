import { cookies } from "next/headers"
import { ZSAError } from "zsa"

export const TEST_USER_ID = 123
export const TEST_USER_ADMIN_ID = 1337
export const TEST_USER_EMAIL = "test@example.com"

export const auth = () => {
  const cookieStore = cookies()
  const cookie = cookieStore.get("session")

  if (!cookie) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
  }

  if (cookie.value === "admin") {
    return {
      id: TEST_USER_ADMIN_ID,
      email: TEST_USER_EMAIL,
      name: "Sally Smith",
    }
  }

  return {
    id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    name: "Bob Jones",
  }
}

export const getPostById = (id: "testUserAuthor" | "notTestUserAuthor") => {
  const posts = {
    testUserAuthor: {
      id: "testUserAuthor",
      name: "testUserAuthor",
    },
    notTestUserAuthor: {
      id: "notTestUserAuthor",
      name: "notTestUserAuthor",
    },
  } as const

  return posts[id]
}
