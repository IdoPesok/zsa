"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServerAction } from "@/lib/server-action-hooks"
import { useState } from "react"
import { incrementNumberAction } from "./actions"

export default function IncrementExample() {
  const [counter, setCounter] = useState(0)

  const incrementAction = useServerAction(incrementNumberAction)

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Increment Number</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={async () => {
            const [data, err] = await incrementAction.execute({
              number: counter,
            })
            if (!err) {
              setCounter(data)
            }
          }}
        >
          Invoke action
        </Button>
        <p>Count:</p>
        <div>{incrementAction.isLoading ? "loading..." : counter}</div>
      </CardContent>
    </Card>
  )
}
