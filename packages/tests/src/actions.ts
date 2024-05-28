"use server"

import {
  adminAction,
  ownsPostAction,
  ownsPostIsAdminAction,
  protectedAction,
  publicAction,
} from "./procedures"

export const helloWorldAction = publicAction.handler(async () => {
  return "hello world" as const
})

export const getUserIdAction = protectedAction.handler(async ({ ctx }) => {
  return ctx.auth.id
})

export const getUserGreetingAction = protectedAction.handler(
  async ({ ctx }) => {
    return `Hello, ${ctx.auth.name}!` as const
  }
)

export const getAdminGreetingAction = adminAction.handler(async ({ ctx }) => {
  return `Hello, ${ctx.auth.name}!` as const
})

export const getPostByIdAction = ownsPostAction.handler(async ({ ctx }) => {
  return ctx.post
})

export const getPostByIdIsAdminAction = ownsPostIsAdminAction.handler(
  async ({ ctx }) => {
    return ctx.post
  }
)
