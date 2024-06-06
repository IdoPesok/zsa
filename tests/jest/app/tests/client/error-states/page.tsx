"use client"

import { useState } from "react"
import { errorAction } from "server/actions"
import { useServerAction } from "zsa-react"

export default function ErrorStatesUI() {
  const { isError, error, execute } = useServerAction(errorAction)
  const [manualError, setManualError] = useState<string | undefined>(undefined)

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          const [data, err] = await execute({
            number: 0,
          })

          if (err) {
            setManualError(JSON.stringify(err.fieldErrors?.number))
          }
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
      {manualError && <div role="manual-error">{manualError}</div>}
    </div>
  )
}
