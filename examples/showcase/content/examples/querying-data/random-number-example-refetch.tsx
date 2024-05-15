"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useQueryClient } from "@tanstack/react-query"

export default function RandomNumberRefetch() {
  const queryClient = useQueryClient()

  return (
    <Card className="p-4 w-full ">
      <Button
        onClick={() => {
          queryClient.refetchQueries({
            queryKey: ["getRandomNumber"],
          })
        }}
        className="w-full"
      >
        refetch
      </Button>
    </Card>
  )
}
