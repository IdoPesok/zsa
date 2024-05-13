"use client"

import { ActionKeyFactory, useServerActionsUtils } from "@/lib/server-action-hooks"

export default function ClientPlaygroundTwo() {
  const { refetch } = useServerActionsUtils()

  return (
    <div>
      <button
        onClick={async () => {
          refetch(ActionKeyFactory.postDetails('something'))
        }}
      >
        refetch
      </button>
    </div>
  )
}
