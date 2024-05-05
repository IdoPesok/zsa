import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
import { z } from "zod"


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

const getPost = (id: string) => true
const getUserOwnsPost = (str: string, str1: number) => true


const protectedProcedure = createServerActionProcedure()
  .noInputHandler(async () => {
    return {
      user: {
        name: "IDO",
        id: 1,
        email: "dsfdsfdsf",
      },
    }
  })



const postExistsProcedure = createServerActionProcedure()
  .input(z.object({ postId: z.string() }))
  .handler(async ({ input }) => {
    const valid = await getPost(input.postId)

    if (!valid) throw Error()

    return valid
  })



export const protectedAction = createServerActionWrapper()
  .procedure(protectedProcedure)
  .createAction()
  .input(z.object({ hello: z.string() }))
  .onComplete(async (onCompleteCallback) => {
    if (onCompleteCallback.isSuccess) {
      console.log('on complete')
      onCompleteCallback.args.hello
    }
  })
  .onError(async (onErrorCallback) => {
    if (onErrorCallback.message) {
      console.log('on error')
    }
  })
  .onStart(async (onStartCallback) => {
    if (onStartCallback.args) {
      console.log('on start')
    }
  })
  .onInputParseError(async (onInputParseErrorCallback) => {
    console.log('zod error')
  })
  .onSuccess(async (onSuccessCallback) => {
    console.log('on success')
  })
  .output(z.object({ hello: z.string() }))
  .timeout(1000)
  .handler(async ({ input, ctx }) => {
    return input
  })


