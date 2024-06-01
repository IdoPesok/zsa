"use client"

import { statesAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function StatesUI() {
  const { data, status, isPending, isSuccess, isError, error, execute } =
    useServerAction(statesAction)

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          await execute({ status: "success" })
        }}
      >
        Invoke Success
      </button>
      <button
        role="invoke-error"
        onClick={async () => {
          await execute({ status: "error" })
        }}
      >
        Invoke Error
      </button>
      <div role="data">{data ?? CLIENT_TEST_DATA.initialMessage}</div>
      <div role="status">{status}</div>
      <div role="isPending">{isPending.toString()}</div>
      <div role="isSuccess">{isSuccess.toString()}</div>
      <div role="isError">{isError.toString()}</div>
      {isError && <div role="error">{error?.message}</div>}
    </div>
  )
}
