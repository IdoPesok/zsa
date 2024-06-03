"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useFormState } from "react-dom"
import { toast } from "sonner"
import { produceNewMessage } from "./actions"

export default function UseFormStateExample() {
  let [messages, submitAction] = useFormState(
    async (previousState: string[], formData: FormData) => {
      const [data, err] = await produceNewMessage(formData)

      if (err) {
        toast.error("Error! " + JSON.stringify(err.fieldErrors?.name))
        return previousState
      }

      return [...previousState, data]
    },
    ["my initial message"]
  )

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
        <h1>Messages:</h1>
        <div>
          {messages.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
