"use client"

import { useState } from "react"
import { loadingGetUserGreetingAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function UserGreetingUI() {
  const [result, setResult] = useState<string>(CLIENT_TEST_DATA.initialMessage)

  const { isPending, execute } = useServerAction(loadingGetUserGreetingAction)

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
        Get User Greeting
      </button>
      <div role="result">
        {isPending ? CLIENT_TEST_DATA.loadingMessage : result}
      </div>
    </div>
  )
}
