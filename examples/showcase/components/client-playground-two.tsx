"use client"

import { useServerActionsUtils } from "@/lib/use-server-action"

export default function ClientPlaygroundTwo() {
  const { refetch } = useServerActionsUtils()

  return (
    <div>
      <button
        onClick={async () => {
          refetch("")
        }}
      >
        refetch
      </button>
    </div>
  )
}
