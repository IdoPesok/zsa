"use client"

import { errorAction } from "server/actions"
import { useServerAction } from "zsa-react"

export default function ErrorStatesUI() {
    const { isError, error, execute } = useServerAction(errorAction)

    return (
        <div>
            <button
                role="invoke"
                onClick={async () => {
                    await execute()
                }}
            >
                Invoke Error Action
            </button>
            <div role="isError">{isError.toString()}</div>
            {isError && <div role="result">{error?.message}</div>}
        </div>
    )
}