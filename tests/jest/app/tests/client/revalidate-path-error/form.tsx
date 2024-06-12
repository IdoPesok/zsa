"use client"

import { useServerAction } from "zsa-react"
import { testAction } from "./actions"

export default function TestForm() {
  const { execute, isPending } = useServerAction(testAction)

  return (
    <div>
      <button
        onClick={async () => {
          const [data, err] = await execute({ name: "test" })

          if (err) {
            console.log(err.data)
          }
        }}
        disabled={isPending}
      >
        {isPending ? "Invoking..." : "Invoke action"}
      </button>
    </div>
  )
}
