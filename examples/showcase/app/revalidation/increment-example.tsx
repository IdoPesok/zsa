"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useServerAction } from "zsa-react"
import { incrementNumberAction } from "./actions"

export default function IncrementExample() {
  const [counter, setCounter] = useState(0)

  const { isPending, execute, data, error, isError } = useServerAction(
    incrementNumberAction,
    {
      onSuccess({ data: count }) {
        setCounter(count ?? 0)
        console.log("isPending", isPending)
        if (isPending) {
          alert("success was called even before transition was done")
        }
      },
    }
  )

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Increment Number</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          disabled={isPending}
          onClick={() => {
            execute({
              number: counter,
            })
          }}
        >
          Invoke action
        </Button>
        <p>Count:</p>
        <div>{isPending ? "saving..." : data}</div>
        {isError && error.code === "INPUT_PARSE_ERROR" && (
          <div>{error.fieldErrors.number}</div>
        )}
      </CardContent>
    </Card>
  )
}
