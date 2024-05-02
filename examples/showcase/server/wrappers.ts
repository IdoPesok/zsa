"use server"

import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
import { z } from "zod"

const protectedProcedure = createServerActionProcedure().noInputHandler(() => {
  return {
    user: {
      name: "IDO",
      id: 1,
    },
  }
})

const admin = createServerActionProcedure()
  .input(z.object({ user: z.object({ id: z.number(), name: z.string() }) }))
  .handler(({ input }) => {
    if (input.user.id !== 1) throw new Error("You are not authorized")
    return {
      user: input.user,
    }
  })

export const protectedWrapper = createServerActionWrapper()

export const adminWrapper = createServerActionWrapper()
  .procedure(protectedProcedure)
  .chainProcedure(admin)
