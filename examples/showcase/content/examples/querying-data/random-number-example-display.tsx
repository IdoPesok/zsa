"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useServerAction } from "@/lib/server-action-hooks"
import { getRandomNumber } from "./actions"

export default function RandomNumberDisplay() {
  const queryAction = useServerAction(getRandomNumber, {
    input: {
      min: 0,
      max: 10,
    },
    actionKey: ["getRandomNumber"],
  })

  console.log('isLoading', queryAction.isLoading)

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
        {queryAction.isSuccess && (
          <>{JSON.stringify(queryAction.data.number)}</>
        )}
      </CardContent>
    </Card>
  )
}
