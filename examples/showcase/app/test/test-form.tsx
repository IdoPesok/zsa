"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useServerAction } from "zsa-react"
import { testAction } from "./test-actions"

export default function TestForm() {
  const { execute, isPending, data, error } = useServerAction(testAction, {
    onSuccess: ({ data }) => {
      toast(data)
    },
  })

  return (
    <div>
      <Button
        onClick={() => {
          execute({ name: "test" })
        }}
        disabled={isPending}
      >
        {isPending ? "Invoking..." : "Invoke action"}
      </Button>
      {error && <div>Error: {JSON.stringify(error.fieldErrors)}</div>}
    </div>
  )
}
