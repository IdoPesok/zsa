"use client"

import { useServerAction } from "zsa-react"
import { testAction } from "./actions"

export default function TestForm() {
  const { execute, isPending, error, data, isSuccess, isError } =
    useServerAction(testAction, {
      onSuccess: ({ data }) => {
        console.log(data)
      },
    })

  return (
    <div>
      <button
        onClick={() => {
          if (!isSuccess) {
            execute({ name: "test" })
          } else if (isSuccess) {
            execute({ name: "test1" })
          }
        }}
        disabled={isPending}
      >
        {isPending ? "Invoking..." : "Invoke action"}
      </button>
      {isError && <div>Error: {JSON.stringify(error.fieldErrors)}</div>}
      {isSuccess && <div id="data">{data}</div>}
    </div>
  )
}
