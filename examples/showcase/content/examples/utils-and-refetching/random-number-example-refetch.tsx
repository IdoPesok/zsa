"use client"

import { Button } from "@/components/ui/button"
import { useServerActionsUtils } from "@/lib/use-server-action"

export default function RandomNumberExampleRefetch() {
    const { refetch } = useServerActionsUtils()

    return (
        <Button
            onClick={() => {
                refetch("getRandomNumber")
            }}
        >
            refetch
        </Button>
    )
}
