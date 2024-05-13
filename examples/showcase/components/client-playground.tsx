"use client"

import { useServerAction } from "@/lib/server-action-hooks"
import { generateRandomNumber, searchContacts } from "@/server/actions"
import { useDebounce } from "@uidotdev/usehooks"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Input } from "./ui/input"
import { Skeleton } from "./ui/skeleton"

export default function ClientPlayground() {
  const [input, setInput] = useState("")
  const debouncedInput = useDebounce(input, 300)

  const queryAction = useServerAction(searchContacts, {
    input: {
      query: debouncedInput,
    },
    onError: ({ err, refetch }) => {
      console.log("onError", err)
      refetch()
    },
    onSuccess: ({ data }) => {
      console.log("onSuccess", data)
    },
    onStart: () => {
      console.log("onStart")
    },
    enabled: Boolean(debouncedInput),
    actionKey: ['posts', 'details', '123']
  })
  const { execute, setOptimistic, data } = useServerAction(generateRandomNumber)

  let contactsView

  if (queryAction.data) {
    contactsView = (
      <div>
        {queryAction.data.map((c) => (
          <div key={c.id}>{c.name}</div>
        ))}
        {queryAction.isLoadingOptimistic && "Saving..."}
      </div>
    )
  } else if (queryAction.isLoading) {
    contactsView = <Skeleton />
  } else if (queryAction.isError) {
    contactsView = (
      <div className="text-red-500">
        Error: {JSON.stringify(queryAction.error)}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call From Client Component</CardTitle>
        <CardDescription>
          This card fetches data from a client component
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Input
          placeholder="Search contacts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <h1>Search Results</h1>
        {contactsView}
        <button
          onClick={async () => {
            // call it with just a value
            setOptimistic({ number: Math.floor(Math.random() * (100 - 1)) + 1 })

            // call it with a function that takes in the current value
            setOptimistic((current) => ({
              number: current ? current.number + 1 : 0,
            }))

            await execute({ min: 1, max: 100 })
          }}
        ></button>
      </CardContent>
    </Card>
  )
}
