"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useServerAction } from "zsa-react"
import { produceNewMessage } from "./actions"

export const ExecuteFormAction = () => {
  const { isPending, executeFormAction, isSuccess, data, isError, error } =
    useServerAction(produceNewMessage)

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Form Example</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-col gap-4" action={executeFormAction}>
          <Input type="text" name="name" placeholder="Enter your name..." />
          <Button className="w-full" type="submit" disabled={isPending}>
            Submit
          </Button>
          {isPending && <div>Loading...</div>}
          {isSuccess && <div>Success: {JSON.stringify(data)}</div>}
          {isError && <div>Error: {JSON.stringify(error.fieldErrors)}</div>}
        </form>
      </CardContent>
    </Card>
  )
}
