"use client"

import { errorAction } from "server/actions"
import { TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function RetryStatesUI() {
  const { isError, error, execute, isPending } = useServerAction(errorAction, {
    retry: {
      maxAttempts: TEST_DATA.retries.maxAttempts,
      delay: TEST_DATA.retries.delay,
    },
  })

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          await execute({
            number: 0,
          })
        }}
      >
        Invoke Error Action
      </button>
      <div role="isError">{isError.toString()}</div>
      <div role="isPending">{isPending ? "yes" : "no"}</div>
      {isError && <div role="result">{error?.message}</div>}
    </div>
  )
}
