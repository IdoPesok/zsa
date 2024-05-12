"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useServerActionsUtils } from "server-actions-wrapper/src"

export default function RandomNumberRefetch() {
  const { refetch } = useServerActionsUtils()

  return (
    <Card className="p-4 w-full ">
      <Button
        onClick={() => {
          refetch("getRandomNumber")
        }}
        className="w-full"
      >
        refetch
      </Button>
    </Card>
  )
}
