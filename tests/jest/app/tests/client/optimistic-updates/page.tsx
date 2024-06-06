"use client"

import { useState } from "react"
import { optimisticAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function OptimisticUpdatesUI() {
  const [result, setResult] = useState<string>(CLIENT_TEST_DATA.initialMessage)
  const { data, isOptimistic, isPending, execute, setOptimistic } =
    useServerAction(optimisticAction, {
      initialData: CLIENT_TEST_DATA.initialMessage,
    })

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          setOptimistic(CLIENT_TEST_DATA.dummyMessage)
          const [data, err] = await execute()
          if (!err) {
            setResult(data)
          }
        }}
      >
        Invoke Optimistic Action
      </button>
      <div role="data">{data}</div>
      <div role="isOptimistic">{isOptimistic.toString()}</div>
      <div role="isPending">{isPending.toString()}</div>
      <div role="result">{result}</div>
    </div>
  )
}
