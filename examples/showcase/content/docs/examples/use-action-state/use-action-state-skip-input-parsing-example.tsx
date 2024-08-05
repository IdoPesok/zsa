"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFormState } from "react-dom"
import { produceNewMessageSkipInputParsing } from "./actions"

export default function UseActionStateSkipInputParsingExample() {
  let [[data, err], submitAction, isPending] = useFormState(produceNewMessageSkipInputParsing, [
    null,
    null,
  ])

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Skip Input Parsing</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={submitAction} className="flex flex-col gap-4">
          <Input name="name" placeholder="Enter your name..." />
          <Button disabled={isPending}>Create message</Button>
        </form>
        {isPending && <div>Loading...</div>}
        {data && <p>Message: {data}</p>}
        {err && <div>Error: {JSON.stringify(err)}</div>}
      </CardContent>
    </Card>
  )
}