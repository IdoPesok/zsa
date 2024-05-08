"use client"

import { useServerActionsUtils } from "server-actions-wrapper"

export default function ClientPlaygroundTwo() {
  const { refetch } = useServerActionsUtils()

  return (
    <div>
      <button
        onClick={async () => {
          refetch("getFakeData")
        }}
      >
        refetch
      </button>
    </div>
  )
}
