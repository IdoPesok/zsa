"use client"

import { nextRedirectAction } from "server/actions"
import { useServerAction } from "zsa-react"

export default function HelloWorldUI() {
  const { isPending, execute } = useServerAction(nextRedirectAction, {
    onSuccess: () => {
      console.log("redirected")
    },
  })

  return (
    <div>
      <button
        disabled={isPending}
        onClick={async () => {
          await execute()
        }}
      >
        Invoke action
      </button>
    </div>
  )
}
