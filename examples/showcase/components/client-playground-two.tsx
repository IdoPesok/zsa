"use client"

import { useServerActionsUtils } from "@/lib/utils"
import {
  ServerActionKeys,
  createServerActionsKeyFactory,
} from "../../../packages/server-actions-wrapper/dist"

const factory = createServerActionsKeyFactory({
  a: () => ["a"],
  b: () => ["b", "c"],
  c: (id: string) => ["c", id],
})

type TFactory = ServerActionKeys<typeof factory>

export default function ClientPlaygroundTwo() {
  const { refetch } = useServerActionsUtils()

  return (
    <div>
      <button
        onClick={async () => {
          refetch(["posts"])
        }}
      >
        refetch
      </button>
    </div>
  )
}
