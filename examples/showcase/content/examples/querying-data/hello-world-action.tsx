"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useServerAction } from "@/lib/server-action-hooks"
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
  })

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

        {queryAction.isLoading ? "loading..." : queryAction.data}
      </CardContent>
    </Card>
  )
}
