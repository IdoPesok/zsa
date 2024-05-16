"use client"

import { QueryKeyFactory } from "@/lib/hooks/server-action-hooks"
import { useQueryClient } from "@tanstack/react-query"

export default function ClientPlaygroundTwo() {
  const queryClient = useQueryClient()

  return (
    <div>
      <button
        onClick={async () => {
          queryClient.refetchQueries({
            queryKey: QueryKeyFactory.getPosts(),
          })
        }}
      >
        refetch
      </button>
    </div>
  )
}
