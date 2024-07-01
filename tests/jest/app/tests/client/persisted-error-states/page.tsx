"use client"

import { errorActionWithPause } from "server/actions"
import { useServerAction } from "zsa-react"

export default function PersistedErrorStatesUI() {
  const { error, execute, isPending } = useServerAction(errorActionWithPause, {
    persistErrorWhilePending: true,
  })

  return (
    <div>
      <button
        role="invoke"
        disabled={isPending}
        onClick={async () => {
          execute({
            number: 0,
          })
        }}
      >
        Invoke Error Action
      </button>
      {error?.code === "INPUT_PARSE_ERROR" && (
        <div role="field-errors">
          {JSON.stringify(error?.fieldErrors.number)}
        </div>
      )}
    </div>
  )
}
