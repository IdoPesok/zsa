"use client"

import { useState } from "react"
import { loadingHelloWorldAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function HelloWorldUI() {
  const [result, setResult] = useState<"helloWorldAction" | "NOTHING">(
    CLIENT_TEST_DATA.initialMessage
  )

  const { isPending, execute } = useServerAction(loadingHelloWorldAction)

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          const [data, err] = await execute({ ms: CLIENT_TEST_DATA.sleep })
          if (!err) {
            setResult(data)
          }
        }}
      >
        Invoke action
      </button>
      <div role="result">
        {isPending ? CLIENT_TEST_DATA.loadingMessage : result}
      </div>
    </div>
  )
}
