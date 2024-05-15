"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServerActionMutation } from "@/lib/hooks/server-action-hooks"
import { useState } from "react"
import { incrementNumberAction } from "./actions"

export default function IncrementExample() {
  const [counter, setCounter] = useState(0)

  const incrementAction = useServerActionMutation(incrementNumberAction, {
    mutationKey: ["incrementNumberAction"],
  })

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Increment Number</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={async () => {
            await incrementAction.mutateAsync({
              number: counter,
            })

            setCounter((prev) => prev + 1)
          }}
        >
          Invoke action
        </Button>
        <p>Count:</p>
        <div>{incrementAction.isPending && "saving..."}</div>
        <div>{incrementAction.data && incrementAction.data}</div>
      </CardContent>
    </Card>
  )
}
