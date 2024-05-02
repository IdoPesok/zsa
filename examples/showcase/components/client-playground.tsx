"use client"

import { Input } from "@/components/ui/input"
import { useServerAction } from "@/lib/use-server-action"
import { generateRandomNumber, getFakeData } from "@/server/actions"
import { useState } from "react"
import ClientPlaygroundTwo from "./client-playground-two"
import { Button } from "./ui/button"

export default function ClientPlayground() {
  const [input, setInput] = useState("")

  const queryAction = useServerAction(getFakeData, {
    input: {
      length: 100,
    },
    enabled: Boolean(input),
    refetchKey: "getFakeData",
  })
  const fakeAction = useServerAction(generateRandomNumber)

  return (
    <div>
      <h1>Send greeting</h1>
      <ClientPlaygroundTwo />
      {!queryAction.data
        ? queryAction.status
        : JSON.stringify(queryAction.data, null, 2)}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your name..."
      />
      <div>{fakeAction.isLoading}</div>
      {fakeAction.data && <div>{JSON.stringify(fakeAction.data.number)}</div>}
      <Button
        onClick={async () => {
          if (fakeAction.isLoading) {
            alert("Action is already executing")
            return
          }

          const [data, err] = await fakeAction.execute({
            min: 1000,
            max: 100,
          })

          if (err) {
            alert("Action failed: " + err.code)
            return
          }
        }}
      >
        Execute
      </Button>
    </div>
  )
}
