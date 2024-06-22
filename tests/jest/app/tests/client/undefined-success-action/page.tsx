"use client"

import { undefinedSuccessAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function UndefinedSuccessActionUI() {
  const { isPending, execute, isSuccess } = useServerAction(
    undefinedSuccessAction
  )

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          await execute({ ms: CLIENT_TEST_DATA.sleep })
        }}
      >
        Invoke action
      </button>
      <div role="result">
        {isPending
          ? CLIENT_TEST_DATA.loadingMessage
          : JSON.stringify(isSuccess)}
      </div>
    </div>
  )
}
