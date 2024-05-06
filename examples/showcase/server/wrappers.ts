import { createServerActionWrapper } from "server-actions-wrapper"
import { z } from "zod"

const wrapper = createServerActionWrapper()

const exampleAction = wrapper
  .createAction()
  .input(z.object({ message: z.string() }))
  .onStart(async ({ args }) => {
    console.log("onStart")
  })
  .onSuccess(async (args) => {
    console.log("onSuccess")
  })
  .onComplete(async (args) => {
    console.log("onComplete")
  })
  .onError(async (args) => {
    console.log("onError")
  })
  .onInputParseError(async (args) => {
    console.log("onInputParseError")
  })
  .handler(async ({ input }) => {
    console.log(input.message)
    return "hello"
  })
