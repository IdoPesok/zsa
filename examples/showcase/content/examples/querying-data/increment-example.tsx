"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useServerAction } from "zsa-react"
import { incrementNumberAction } from "./actions"

export default function IncrementExample() {
  const [counter, setCounter] = useState(0)

  const { isPending, execute, setOptimistic, data } = useServerAction(
    incrementNumberAction
  )

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Increment Number</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          onClick={async () => {
            setOptimistic(10)
            const [data, err] = await execute({
              number: counter,
            })

            setCounter((prev) => prev + 1)
          }}
        >
          Invoke action
        </Button>
        <p>Count:</p>
        <div>{isPending && "saving..."}</div>
        <div>{data}</div>
      </CardContent>
    </Card>
  )
}
