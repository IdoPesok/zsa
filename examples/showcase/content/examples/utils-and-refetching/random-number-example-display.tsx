"use client"

import { useServerAction } from "@/lib/use-server-action"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { getRandomNumber } from "./actions"
import { memo } from "react"



function RandomNumberExampleDisplay() {
    const queryAction = useServerAction(getRandomNumber, {
        input: undefined,
        refetchKey: "getRandomNumber"
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Random number</CardTitle>
                <CardDescription>
                    This fetches a random number upon mounting
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <p>Random number:</p>
                {queryAction.isLoading ? 'loading...' : ''}
                {queryAction.isSuccess && <>{JSON.stringify(queryAction.data.number)}</>}
            </CardContent>
        </Card>
    )
}

export default memo(RandomNumberExampleDisplay)