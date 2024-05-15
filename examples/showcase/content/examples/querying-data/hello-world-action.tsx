"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useServerActionInfiniteQuery,
  useServerActionQuery,
} from "@/lib/hooks/react-query-server-actions"
import { useDebounce } from "@uidotdev/usehooks"
import { useState } from "react"
import { helloWorldAction } from "./actions"

export default function HelloWorld() {
  const [input, setInput] = useState("")
  const debouncedInput = useDebounce(input, 300)

  const query = useServerActionQuery({
    queryFn: () =>
      helloWorldAction({
        message: debouncedInput,
      }),
    queryKey: [debouncedInput],
    enabled: Boolean(debouncedInput),
    initialData: {
      result: "124124",
    },
  })

  const testQuery = useServerActionInfiniteQuery({
    queryFn: ({ pageParam }) =>
      helloWorldAction({ message: pageParam.toString() }),
    queryKey: ["test"],
    initialPageParam: 0,
    getNextPageParam: (lastPage) => 5 + 2,
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
        {query.isPending ? "loading..." : query.data.result}
      </CardContent>
    </Card>
  )
}
