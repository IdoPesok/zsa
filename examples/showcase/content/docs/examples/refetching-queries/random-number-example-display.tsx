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
  const { isLoading, isRefetching, isSuccess, data } = useServerActionQuery(
    getRandomNumber,
    {
      input: {
        min: 0,
        max: 100,
      },
      queryKey: ["getRandomNumber"], //this is now typesafe due to our QueryKeyFactory
    }
  )

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
        {isSuccess && <>{JSON.stringify(data.number)}</>}
        {isLoading ? " loading..." : ""}
        {isRefetching ? " refetching..." : ""}
      </CardContent>
    </Card>
  )
}
