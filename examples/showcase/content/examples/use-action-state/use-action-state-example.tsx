"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFormState } from "react-dom"
import { createActionStateHookFrom } from "zsa-react"
import { produceNewMessage } from "./actions"

const useAction = createActionStateHookFrom(useFormState)

export default function UseActionStateExample() {
  const [{ data, error }, submitAction, isPending] =
    useAction(produceNewMessage)

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Use Form State</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={submitAction} className="flex flex-col gap-4">
          <Input name="name" placeholder="Enter your name..." />
          <Button>Create message</Button>
        </form>
        {isPending ? (
          <div>loading...</div>
        ) : data ? (
          <div>{data}</div>
        ) : error ? (
          <div>error : {JSON.stringify(error)}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
