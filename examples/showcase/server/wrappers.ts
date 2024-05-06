import {
  createServerActionProcedure,
  createServerActionWrapper,
} from "server-actions-wrapper"
import { z } from "zod"

const getUser = async () => {
  return {
    id: 0,
  }
}


const isAuthed = createServerActionProcedure()
  .onStart(async () => {
    console.log('onStart')
  })
  .onSuccess(async () => {
    console.log('onSuccess')
  })
  .onComplete(async () => {
    console.log('onComplete')
  })
  .onError(async () => {
    console.log('onError')
  })
  .noInputHandler(async () => {
    const { id } = await getUser()

    if (!id) {
      throw new Error('UNAUTHORIZED')
    }

    return {
      user: {
        id,
      },
    }
  })


const wrapper = createServerActionWrapper()

const exampleAction = wrapper
  .createAction()
  .input(z.object({ message: z.string() }))
  .onStart(async () => {
    console.log('onStart')
  })
  .onSuccess(async () => {
    console.log('onSuccess')
  })
  .onComplete(async () => {
    console.log('onComplete')
  })
  .onError(async () => {
    console.log('onError')
  })
  .onInputParseError(async () => {
    console.log('onInputParseError')
  })
  .handler(async ({ input }) => {
    console.log(input.message)
    return "hello"
  })

