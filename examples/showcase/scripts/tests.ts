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
    .handler(({ input }) => {
      console.log("one handler", input)
      return {
        greeting: `Hello ${input.name}`,
      }
    })

  const two = createServerActionProcedure(one).handler(({ input }) => {
    console.log("two handler", input)
    return {
      other: `Hello ${input.greeting}`,
    }
  })

  const three = createServerActionProcedure()
    .input(z.object({ other: z.string() }))
    .handler(({ input }) => {
      console.log("three handler", input)
      return {
        greeting: `Hello ${input.other}`,
      }
    })

  const wrapper = createServerActionWrapper().procedure(one)

  const admin = wrapper.chainProcedure(two).chainProcedure(three)

  const myAction = admin
    .createActionWithProcedureInput({
      name: "IDO",
    })
    .id("HELLO WORLD")
    .input(z.object({ name: z.string() }).default({ name: "IDO" }))
    .handler(({ ctx, input }) => {
      return "YOOHOOO" + input.name
    })

  const [data, err] = await myAction(undefined)

  console.log("got error", err)
  console.log("got data", data)
}

main()
