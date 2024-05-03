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

  const wrapper = createServerActionWrapper().procedure(one)

  const myAction = wrapper
    .createActionWithProcedureInput({
      name: "IDO",
    })
    .onStart(async ({ args }) => {
      console.log("onStart", args)
      await new Promise((r) => setTimeout(r, 3000))
      console.log("onStart finished", args)
    })
    .onSuccess(async ({ args, data }) => {
      console.log("onSuccess", args, data)
      await new Promise((r) => setTimeout(r, 3000))
      console.log("onSuccess finished", args, data)
    })
    .onComplete(async (data) => {
      console.log("onComplete", JSON.stringify(data, null, 2))
      await new Promise((r) => setTimeout(r, 3000))
      console.log("onComplete finished", JSON.stringify(data, null, 2))
    })
    .noInputHandler(({ ctx }) => {
      console.log("noInputHandler", ctx)

      return "YOOHOOO"
    })

  const [data, err] = await myAction()

  console.log(data)
}

main()
