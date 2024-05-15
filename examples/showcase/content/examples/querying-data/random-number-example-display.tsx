"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useServerActionQuery } from "@/lib/hooks/server-action-hooks"
import { getRandomNumber } from "./actions"

export default function RandomNumberDisplay() {
  const queryAction = useServerActionQuery(getRandomNumber, {
    input: {
      min: 0,
      max: 100,
    },
    queryKey: ["getRandomNumber"],
  })

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Random number</CardTitle>
        <CardDescription>
          This fetches a random number upon mounting
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p>Random number:</p>
        {queryAction.isLoading ? "loading..." : ""}
        {queryAction.isRefetching ? "refetching..." : ""}
        {queryAction.isSuccess && (
          <>{JSON.stringify(queryAction.data.number)}</>
        )}
      </CardContent>
    </Card>
  )
}
