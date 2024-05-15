"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useQueryCustom } from "@/lib/hooks/react-query-custom"
import { useEffect, useState } from "react"
import { getRandomNumber } from "./actions"

export default function RandomNumberDisplay() {
  const [max, setMax] = useState(100)

  useEffect(() => {
    const it = setInterval(() => {
      // set max to a random number between 1 and 100
      setMax(Math.floor(Math.random() * 100) + 1)
    }, 5000)

    return () => clearInterval(it)
  }, [])

  const queryAction = useQueryCustom({
    queryFn: () =>
      getRandomNumber({
        min: 0,
        max,
      }),
    queryKey: ["getRandomNumber", max],
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
