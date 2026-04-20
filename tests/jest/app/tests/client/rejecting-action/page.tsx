"use client"

import { useState } from "react"
import { useServerAction } from "zsa-react"

// Simulates an RSC transport error / unexpected throw from the server-action
// call itself (not a zsa-wrapped error). This exercises the client hook's
// ability to surface such rejections as a tuple rather than leaving the
// `execute()` promise unresolved.
const rejectingAction = (async () => {
  throw new Error("boom")
}) as unknown as Parameters<typeof useServerAction>[0]

export default function RejectingActionUI() {
  const [tuple, setTuple] = useState<string>("initial")
  const [errorState, setErrorState] = useState<string>("initial")

  const { execute } = useServerAction(rejectingAction, {
    onError: ({ err }) => {
      setErrorState(err?.message ?? "no-message")
    },
  })

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          const [data, err] = await execute()
          setTuple(
            JSON.stringify({
              data: data ?? null,
              errMessage: err?.message ?? null,
              errCode: (err as { code?: string } | null)?.code ?? null,
            })
          )
        }}
      >
        Invoke Rejecting Action
      </button>
      <div role="result">{tuple}</div>
      <div role="onError">{errorState}</div>
    </div>
  )
}
