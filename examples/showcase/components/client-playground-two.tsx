"use client"

import { useServerActionsUtils } from "@/lib/server-action-hooks"

export default function ClientPlaygroundTwo() {
  const { refetch } = useServerActionsUtils()

  return (
    <div>
      <button
        onClick={async () => {
          refetch(["posts", "details", "123"])
        }}
      >
        refetch
      </button>
    </div>
  )
}
