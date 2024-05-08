import { createServerActionProcedure } from "server-actions-wrapper"
import { z } from "zod"

export const protectedProcedure = createServerActionProcedure().noInputHandler(
  () => {
    return {
      user: {
        name: "IDO",
        id: 1,
        email: "dsfdsfdsf",
      },
    }
  }
)

export const adminProcedure = createServerActionProcedure(protectedProcedure)
  .input(z.object({ user: z.object({ id: z.number(), name: z.string() }) }))
  .handler(async ({ input }) => {
    if (input.user.id !== 1) throw new Error("You are not authorized")
    return {
      user: input.user,
      isAdmin: true,
      message: `hello ${input.user}`,
    } as const
  })
