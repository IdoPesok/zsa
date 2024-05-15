"use client"

import { useQueryClient } from "@tanstack/react-query"

export default function ClientPlaygroundTwo() {
  const queryClient = useQueryClient()

  return (
    <div>
      <button
        onClick={async () => {
          queryClient.refetchQueries({
            queryKey: ["posts", "details", "something"],
          })
        }}
      >
        refetch
      </button>
    </div>
  )
}
