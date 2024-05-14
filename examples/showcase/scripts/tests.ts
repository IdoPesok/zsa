import { SAWError, createServerAction } from "server-actions-wrapper"
import { z } from "zod"

const main = async () => {
  const test = createServerAction()
    .input(z.object({ message: z.string() }))
    .retry({
      maxAttempts: 3,
      delay: (currentAttempt) =>
        // expontential backoff
        Math.min(
          currentAttempt > 1 ? 2 ** currentAttempt * 1000 : 1000,
          30 * 1000
        ),
    })
    .handler(async ({ input }) => {
      console.log("retrying", input.message, Date.now())
      await new Promise((r) => setTimeout(r, 1000))

      if (Math.random() < 2) {
        throw new SAWError("ERROR", "test error")
      }

      return input.message
    })

  const [data, err] = await test({ message: "hello world" })

  if (err) {
    console.log("error", err)
  } else {
    console.log("data", data)
  }
}

main()
