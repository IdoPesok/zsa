"use client"

import ReactQueryProvider from "app/_providers/react-query-provider"
import { useServerActionMutation } from "lib/hooks/server-action-hooks"
import { useState } from "react"
import { mutationAction } from "server/actions"

function MutationUI() {
  const [name, setName] = useState("")
  const [result, setResult] = useState("")

  const { mutate, isPending, isError, error } =
    useServerActionMutation(mutationAction)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(
      { name },
      {
        onSuccess: (data) => {
          setResult(data.result)
        },
      }
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <button type="submit">Submit</button>
      </form>
      {isPending && <div role="loading">Loading...</div>}
      {isError && <div role="error">{error?.message}</div>}
      {result && <div role="result">{result}</div>}
    </div>
  )
}

export default function MutationUIWithProvider() {
  return (
    <ReactQueryProvider>
      <MutationUI />
    </ReactQueryProvider>
  )
}
