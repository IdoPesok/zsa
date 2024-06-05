"use client"

import { useState } from "react"
import { resetAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function ResetUI() {
  const [result, setResult] = useState<string>(CLIENT_TEST_DATA.initialMessage)
  const { data, execute, reset } = useServerAction(resetAction)

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          const [data, err] = await execute()
          if (!err) {
            setResult(data)
          }
        }}
      >
        Invoke Reset Action
      </button>
      <button role="reset" onClick={reset}>
        Reset
      </button>
      <div role="data">{data ?? CLIENT_TEST_DATA.initialMessage}</div>
      <div role="result">{result}</div>
    </div>
  )
}
