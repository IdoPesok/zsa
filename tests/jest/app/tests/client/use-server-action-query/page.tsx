"use client"

import ReactQueryProvider from "app/_providers/react-query-provider"
import {
  QueryKeyFactory,
  useServerActionQuery,
} from "lib/hooks/server-action-hooks"
import { useState } from "react"
import { queryAction } from "server/actions"

function QueryUI() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data, isLoading, isError, error } = useServerActionQuery(
    queryAction,
    {
      input: { searchTerm },
      queryKey: QueryKeyFactory.queryAction(searchTerm),
    }
  )

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      {isLoading && <div role="loading">Loading...</div>}
      {isError && <div role="error">{error?.message}</div>}
      {data && <div role="data">{data.result}</div>}
    </div>
  )
}

export default function QueryUIWithProvider() {
  return (
    <ReactQueryProvider>
      <QueryUI />
    </ReactQueryProvider>
  )
}
