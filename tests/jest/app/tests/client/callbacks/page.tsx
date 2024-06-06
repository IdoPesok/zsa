"use client"

import { useState } from "react"
import { callbacksAction } from "server/actions"
import { CLIENT_TEST_DATA } from "server/data"
import { useServerAction } from "zsa-react"

export default function CallbacksUI() {
  const [result, setResult] = useState<string>(CLIENT_TEST_DATA.initialMessage)
  const [callbackData, setCallbackData] = useState<{
    onStart: string
    onSuccess: string
    onError: string
    onFinish: string
  }>({
    onStart: CLIENT_TEST_DATA.initialMessage,
    onSuccess: CLIENT_TEST_DATA.initialMessage,
    onError: CLIENT_TEST_DATA.initialMessage,
    onFinish: CLIENT_TEST_DATA.initialMessage,
  })

  const { execute } = useServerAction(callbacksAction, {
    onStart: () =>
      setCallbackData((prev) => ({
        ...prev,
        onStart: CLIENT_TEST_DATA.dummyMessage,
      })),
    onSuccess: () =>
      setCallbackData((prev) => ({
        ...prev,
        onSuccess: CLIENT_TEST_DATA.dummyMessage,
      })),
    onError: () =>
      setCallbackData((prev) => ({
        ...prev,
        onError: CLIENT_TEST_DATA.dummyMessage,
      })),
    onFinish: ([data, err]) => {
      setCallbackData((prev) => ({
        ...prev,
        onFinish: data ? data : err.code,
      }))
    },
  })

  return (
    <div>
      <button
        role="invoke"
        onClick={async () => {
          const [data, err] = await execute({ shouldError: false })
          if (!err) {
            setResult(data)
          }
        }}
      >
        Invoke Callbacks Action
      </button>
      <button
        role="invokeError"
        onClick={async () => {
          const [data, err] = await execute({ shouldError: true })
          if (!err) {
            setResult(data)
          }
        }}
      >
        Invoke Error
      </button>
      <div role="result">{result}</div>
      <div role="onStart">{callbackData.onStart.toString()}</div>
      <div role="onSuccess">{callbackData.onSuccess.toString()}</div>
      <div role="onError">{callbackData.onError.toString()}</div>
      <div role="onFinish">{callbackData.onFinish.toString()}</div>
    </div>
  )
}
