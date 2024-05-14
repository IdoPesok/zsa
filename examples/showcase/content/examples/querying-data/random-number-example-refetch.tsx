"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useServerActionUtils } from "@/lib/server-action-hooks"

export default function RandomNumberRefetch() {
  const { refetch } = useServerActionUtils()

  return (
    <Card className="p-4 w-full ">
      <Button
        onClick={() => {
          refetch(["getRandomNumber"])
        }}
        className="w-full"
      >
        refetch
      </Button>
    </Card>
  )
}
