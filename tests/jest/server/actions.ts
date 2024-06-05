"use server"

import { sleep } from "lib/utils"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { z } from "zod"
import { ZSAError, createServerAction, createServerActionProcedure } from "zsa"
import { TEST_DATA } from "./data"
import {
  adminAction,
  faultyOutputProcedure,
  inputNumberProcedure,
  ownsPostAction,
  ownsPostIsAdminAction,
  previousStateAction,
  protectedAction,
  protectedTimeoutAction,
  publicAction,
  rateLimitedAction,
  redirectAction,
  retryAction,
  setAuthToTwoProcedure,
  setAuthToTwoProcedureWithCounter,
  timeoutAction,
} from "./procedures"

export const helloWorldAction = publicAction.handler(async () => {
  return "hello world" as const
})

export const getUserIdAction = protectedAction.handler(async ({ ctx }) => {
  return ctx.auth.id
})

export const getUserGreetingAction = protectedAction.handler(
  async ({ ctx }) => {
    return `Hello, ${ctx.auth.name}!` as const
  }
)

export const getAdminGreetingAction = adminAction.handler(async ({ ctx }) => {
  return `Hello, ${ctx.auth.name}!` as const
})

export const getPostByIdAction = ownsPostAction.handler(async ({ ctx }) => {
  return ctx.post
})

export const getPostByIdIsAdminAction = ownsPostIsAdminAction.handler(
  async ({ ctx }) => {
    return ctx.post
  }
)

export const faultyAction = protectedAction
  .input(
    z.object({
      errorType: z.enum(["string", "class"]),
    })
  )
  .handler(async ({ input }) => {
    if (input.errorType === "string") {
      throw TEST_DATA.errors.string
    } else {
      throw new Error(TEST_DATA.errors.string)
    }

    return "success"
  })

export const undefinedAction = rateLimitedAction.handler(async ({ ctx }) => {
  return ctx
})

export const helloWorldTimeoutAction = createServerAction()
  .timeout(TEST_DATA.timeout)
  .handler(async () => {
    await sleep(TEST_DATA.timeout + 1000) // trigger timeout
    return "hello world" as const
  })

export const helloWorldProcedureTimeoutAction = timeoutAction.handler(
  async () => {
    await sleep(TEST_DATA.timeout + 1000) // trigger timeout
    return "hello world" as const
  }
)

export const helloWorldProtectedTimeoutAction = protectedTimeoutAction.handler(
  async () => {
    await sleep(TEST_DATA.timeout + 1000) // trigger timeout
    return "hello world" as const
  }
)

export const helloWorldRetryAction = publicAction
  .retry({
    maxAttempts: TEST_DATA.retries.maxAttempts,
    delay: TEST_DATA.retries.delay,
  })
  .handler(async () => {
    throw new Error("forcing retry")
  })

export const helloWorldExponentialRetryAction = publicAction
  .retry({
    maxAttempts: TEST_DATA.retries.maxAttempts,
    delay: (currentAttempt) =>
      TEST_DATA.retries.delay * Math.pow(2, currentAttempt - 1),
  })
  .handler(async () => {
    throw new Error("forcing retry")
  })

export const helloWorldRetryProcedureAction = retryAction.handler(async () => {
  return "hello world" as const
})

export const faultyOutputInProcedureAction = faultyOutputProcedure
  .createServerAction()
  .handler(async () => {
    return
  })

export const faultyOutputAction = publicAction
  .output(
    z.object({
      number: z.number().refine((n) => n > 0),
    })
  )
  .handler(async () => {
    return {
      number: 0,
    }
  })

export const transformedOutputAction = publicAction
  .output(
    z.object({
      number: z.number().transform((n) => 100),
    })
  )
  .handler(async () => {
    return {
      number: 1,
    }
  })

export const inputNumberAction = inputNumberProcedure
  .createServerAction()
  .handler(async ({ input }) => {
    return input
  })

export const inputLargeNumberAction = inputNumberProcedure
  .createServerAction()
  .input(
    z.object({
      number: z.number().refine((n) => n > 100),
    })
  )
  .handler(async ({ input }) => {
    return input
  })

export const multiplyAction = publicAction
  .input(
    z.object({
      number2: z.coerce.number(),
      number1: z.coerce.number(),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number1 * input.number2,
    }
  })

export const multiplyActionWithArray = publicAction
  .input(
    z.object({
      number: z.array(z.coerce.number()),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number.reduce((a, b) => a * b, 1),
    }
  })

export const multiplyActionWithCustomResponse = publicAction
  .input(
    z.object({
      number2: z.coerce.number(),
      number1: z.coerce.number(),
    })
  )
  .handler(async ({ input }) => {
    return new Response(
      JSON.stringify({ result: input.number1 * input.number2 }),
      {
        status: 201,
        headers: {
          "content-type": "application/json",
          "custom-header": "123",
        },
      }
    )
  })

export const protectedMultiplyAction = protectedAction
  .input(
    z.object({
      number2: z.coerce.number(),
      number1: z.coerce.number(),
    })
  )
  .handler(async ({ input, responseMeta }) => {
    if (responseMeta) {
      responseMeta.statusCode = 201
    }

    return {
      result: input.number1 * input.number2,
    }
  })

export const subtractAction = publicAction
  .input(
    z.object({
      number2: z.coerce.number(),
      number1: z.coerce.number(),
      number3: z.coerce.number(),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number1 - input.number2 - input.number3,
    }
  })

export const divideAction = publicAction
  .input(
    z.object({
      number1: z.coerce.number(),
      number2: z.coerce.number().refine((n) => n !== 0),
    })
  )
  .handler(async ({ input }) => {
    return {
      result: input.number1 / input.number2,
    }
  })

export const nextRedirectAction = publicAction.handler(async () => {
  redirect("/123")
  return "123"
})

export const nextNotFoundAction = publicAction.handler(async () => {
  notFound()
  return "123"
})

export const nextRedirectInProcedureAction = redirectAction.handler(
  async () => {
    return "123"
  }
)

export const stateInputAction = publicAction
  .input(z.object({ number: z.coerce.number() }), {
    type: "state",
  })
  .handler(async ({ input, previousState }) => {
    const [data, err] = previousState

    if (data) {
      return data * 2
    }

    return input.number
  })

export const stateInputProcedureAction = previousStateAction
  .input(z.undefined(), {
    type: "state",
  })
  .handler(async ({ ctx }) => {
    return ctx.number
  })

export const formDataAction = publicAction
  .input(
    z.object({
      name: z.string(),
      email: z.string().email(),
      number: z.coerce.number(),
    }),
    {
      type: "formData",
    }
  )
  .handler(async ({ input }) => {
    return {
      name: input.name,
      email: input.email,
      number: input.number,
    }
  })

export const multiEntryFormDataAction = publicAction
  .input(
    z.object({
      name: z.array(z.string()),
    }),
    {
      type: "formData",
    }
  )
  .handler(async ({ input }) => {
    return input.name
  })

export const procedureChainAuthAction = setAuthToTwoProcedure
  .createServerAction()
  .input(z.object({ three: z.enum(["valid", "invalid"]) }))
  .handler(async ({ input }) => {
    if (input.three === "invalid") {
      throw new ZSAError("NOT_AUTHORIZED", "three")
    }
    cookies().set("auth", "three")
    return
  })

export const procedureChainAuthActionWithCounter =
  setAuthToTwoProcedureWithCounter
    .createServerAction()
    .input(z.object({ three: z.enum(["valid", "invalid"]) }))
    .handler(async ({ input, ctx }) => {
      if (input.three === "invalid") {
        throw new ZSAError("NOT_AUTHORIZED", "three")
      }
      cookies().set("auth", "three")
      return {
        counter: ctx.counter + 1,
      }
    })

const testProcedure = createServerActionProcedure()
  // .shapeError((err) => {
  //   return {
  //     custom: true,
  //   } as const
  // })
  .handler(async ({ input }) => {
    return
  })
  .createServerAction()

const test = publicAction
  .shapeError((err) => {
    return {
      custom: true,
    } as const
  })
  .input(z.object({ name: z.string() }))
  .handler(async () => {
    return
  })

const main = async () => {
  const [data, err] = await test({
    name: "12312",
  })
}
