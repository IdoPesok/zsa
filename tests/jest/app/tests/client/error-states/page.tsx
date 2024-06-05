"use client"

import { errorAction } from "server/actions"
import { useServerAction } from "zsa-react"

export default function ErrorStatesUI() {
  const { isError, error, execute } = useServerAction(errorAction)

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
      {error?.code === "INPUT_PARSE_ERROR" && (
        <div role="field-errors">
          {JSON.stringify(error?.fieldErrors.number)}
        </div>
      )}
    </div>
  )
}
