import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
import { z } from "zod"

const main = async () => {
  const one = createServerActionProcedure()
    .input(
      z.object({
        name: z.string(),
      })
    )
    .handler(async ({ input }) => {
      await new Promise((r) => setTimeout(r, 3000))
      return {
        greeting: `Hello ${input.name}`,
      }
    })

  const two = createServerActionProcedure()
    .input(
      z.object({
        greeting: z.string(),
      })
    )
    .handler(async ({ input }) => {
      return {
        message: `${input.greeting}. Goodbye!`,
      }
    })

  const wrapper = createServerActionWrapper().procedure(one).chainProcedure(two)

  const action = wrapper
    .createActionWithProcedureInput({
      name: "IDO",
    })
    .noInputHandler(({ ctx }) => {
      console.log(ctx)
    })

  action()

  const three = createServerActionProcedure().noInputHandler(() => {
    return {
      user: {
        name: "IDO",
        id: 1,
        email: "dsfdsfdsf",
      },
    }
  })

  const wrapper2 = createServerActionWrapper().procedure(three)

  const action2 = wrapper2
    .createAction()
    .input(
      z.object({
        test: z.string(),
      })
    )
    .handler(async ({ input, ctx }) => {
      console.log({
        input,
        ctx,
      })
    })

  action2({
    test: "sdfsdfasf",
  })
}

main()
