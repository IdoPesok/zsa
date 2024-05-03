import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
import { z } from "zod"

const protectedProcedure = createServerActionProcedure()
  .input(
    z.object({
      test: z.string(),
    })
  )
  .handler(() => {
    return {
      user: {
        name: "IDO",
        id: 1,
        email: "dsfdsfdsf",
      },
    }
  })

const admin = createServerActionProcedure()
  .input(z.object({ user: z.object({ id: z.number(), name: z.string() }) }))
  .handler(async ({ input }) => {
    if (input.user.id !== 1) throw new Error("You are not authorized")
    return {
      user: input.user,
      isAdmin: true,
      message: `hello ${input.user}`,
    } as const
  })

const baseAction = createServerActionWrapper().onError((err) => {
  console.log("BASE ACTION ERROR", err)
})

export const protectedAction = baseAction.procedure(protectedProcedure)

export const adminAction = protectedAction.chainProcedure(admin)
