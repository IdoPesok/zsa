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
    .id("one")
    .output(z.object({ greeting: z.string() }))
    .handler(({ input }) => {
      return {
        greeting: `Hello ${input.name}`,
      }
    })

  const wrapper = createServerActionWrapper()
    .timeout(200)
    .onStart(({ args }) => {
      console.log("ON START FROM WRAPPER")
    })
    .onSuccess(async ({ data, id }) => {
      await new Promise((r) => setTimeout(r, 3000))
      console.log("ON SUCCESS FROM WRAPPER", data, id)
    })
    .procedure(one)

  const myAction = wrapper
    .createActionWithProcedureInput({
      name: "IDO",
    })
    .id("HELLO WORLD")
    .onStart(async ({ args }) => {
      console.log("starting action")
      await new Promise((r) => setTimeout(r, 3000))
    })
    .noInputHandler(({ ctx }) => {
      return "YOOHOOO"
    })

  const [data, err] = await myAction()

  console.log("got error", err)
  console.log("got data", data)
}

main()
