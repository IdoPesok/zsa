import { createServerAction, createServerActionProcedure } from "@za/server"
import { z } from "zod"

const exampleAction = createServerAction()
  .input(z.object({ message: z.string() }))
  .onStart(async () => {
    console.log("onStart")
  })
  .onSuccess(async () => {
    console.log("onSuccess")
  })
  .onComplete(async () => {
    console.log("onComplete")
  })
  .onError(async () => {
    console.log("onError")
  })
  .onInputParseError(async () => {
    console.log("onInputParseError")
  })
  .handler(async ({ input }) => {
    console.log(input.message)
  })

const getUser = () => {
  return {
    email: "",
    id: "",
  }
}

const authedProcedure = createServerActionProcedure()
  .onStart(async () => {
    console.log("onStart")
  })
  .onSuccess(async () => {
    console.log("onSuccess")
  })
  .onComplete(async () => {
    console.log("onComplete")
  })
  .onError(async () => {
    console.log("onError")
  })
  .handler(async () => {
    try {
      const { email, id } = await getUser()

      return {
        user: {
          email,
          id,
        },
      }
    } catch {
      throw new Error("User not authenticated")
    }
  })
