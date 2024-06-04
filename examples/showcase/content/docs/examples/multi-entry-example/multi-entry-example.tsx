"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFormState } from "react-dom"
import { multiplyNumbersAction } from "./actions"

export default function MultiEntryExample() {
  let [[data, err], submitAction, isPending] = useFormState(
    multiplyNumbersAction,
    [null, null]
  )

  return (
    <Card className="not-prose">
      <CardHeader>
        <CardTitle>Multi Entry Form</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={submitAction} className="flex flex-col gap-4">
          <Input name="number" placeholder="Enter number..." type="number" />
          <Input name="number" placeholder="Enter number..." type="number" />
          <Input name="filefield" type="file" multiple />
          <Button disabled={isPending}>Multiply Numbers</Button>
        </form>
        {isPending && <div>Loading...</div>}
        {data && <p>Result: {data}</p>}
        {err && <div>Error: {JSON.stringify(err.fieldErrors)}</div>}
      </CardContent>
    </Card>
  )
}
