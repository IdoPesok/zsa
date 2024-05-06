"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useServerAction } from "@/lib/use-server-action"
import { useDebounce } from "@uidotdev/usehooks"
import { useState } from "react"
import { helloWorldAction } from "./actions"

export default function HelloWorld() {
  const [input, setInput] = useState("")
  const debouncedInput = useDebounce(input, 300)

  const queryAction = useServerAction(helloWorldAction, {
    input: {
      message: debouncedInput,
    },
    enabled: Boolean(debouncedInput),
  })

  let messageView

  if (queryAction.isSuccess) {
    messageView = <div>{queryAction.data}</div>
  } else if (queryAction.isLoading) {
    messageView = <Skeleton className="h-20 w-32" />
  } else if (queryAction.isError) {
    messageView = (
      <div className="text-red-500">
        Error: {JSON.stringify(queryAction.error)}
      </div>
    )
  }

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Say hello</CardTitle>
        <CardDescription>
          This card refetches your server action as you type
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Input
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <p>Message response:</p>
        {messageView}
      </CardContent>
    </Card>
  )
}
