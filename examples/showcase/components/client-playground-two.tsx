"use client"

import {
  ActionKeyFactory,
  useServerActionUtils,
} from "@/lib/server-action-hooks"

export default function ClientPlaygroundTwo() {
  const { refetch } = useServerActionUtils()

  return (
    <div>
      <button
        onClick={async () => {
          refetch(ActionKeyFactory.postDetails("something"))
        }}
      >
        refetch
      </button>
    </div>
  )
}
