"use client"

import { useServerAction } from "zsa-react"
import { testAction } from "./actions"

export default function TestForm() {
  const { execute, isPending, data, error } = useServerAction(testAction, {
    onSuccess: ({ data }) => {
      console.log(data)
    },
  })

  return (
    <div>
      <button
        onClick={() => {
          execute({ name: "test" })
        }}
        disabled={isPending}
      >
        {isPending ? "Invoking..." : "Invoke action"}
      </button>
      {error && <div>Error: {JSON.stringify(error.fieldErrors)}</div>}
    </div>
  )
}
