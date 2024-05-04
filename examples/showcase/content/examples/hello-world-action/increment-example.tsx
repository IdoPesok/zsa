"use client"

import { useServerAction } from "@/lib/use-server-action"
import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { incrementNumberAction } from "./actions"
import { Button } from "@/components/ui/button"

export default function IncrementExample() {
    const [counter, setCounter] = useState(0)

    const incrementAction = useServerAction(incrementNumberAction)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Increment Number</CardTitle>
                <CardDescription>
                    Click the button to compute addition in your server action on the backend.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button onClick={async () => {
                    const [data, err] = await incrementAction.execute({ number: counter })
                    if (!err) {
                        setCounter(data)
                    }
                }}>
                    Invoke action
                </Button>
                <p>Count:</p>
                <div>{incrementAction.isLoading ? 'loading...' : counter}</div>
            </CardContent>
        </Card>
    )
}
