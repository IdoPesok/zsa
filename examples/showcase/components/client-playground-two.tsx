"use client"

import { useServerActionsUtils } from "@/lib/utils"

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
