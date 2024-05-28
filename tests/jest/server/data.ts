import { cookies } from "next/headers"
import { ZSAError } from "zsa"

export const TEST_DATA = {
  user: {
    id: 123,
    name: "Bob Jones",
    email: "test@example.com",
  },
  admin: {
    id: 1337,
    name: "Sally Smith",
    email: "test@example.com",
  },
  posts: {
    testUserAuthor: {
      id: "testUserAuthor",
      name: "testUserAuthor",
    },
    notTestUserAuthor: {
      id: "notTestUserAuthor",
      name: "notTestUserAuthor",
    },
  },
  session: {
    admin: "admin",
  },
  errors: {
    notAuthorized: "NOT_AUTHORIZED",
    string: "STRING_ERROR",
    doesNotOwnPost: "DOES_NOT_OWN_POST",
  },
} as const

export const auth = () => {
  const cookieStore = cookies()
  const cookie = cookieStore.get("session")

  if (!cookie) {
    throw new ZSAError("NOT_AUTHORIZED", "Not authorized")
  }

  if (cookie.value === TEST_DATA.session.admin) {
    return TEST_DATA.admin
  }

  return TEST_DATA.user
}

export const getPostById = (id: keyof typeof TEST_DATA.posts) => {
  return TEST_DATA.posts[id]
}
