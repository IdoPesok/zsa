"use client"

import { resetTestCookies } from "./test-actions"

export default function ResetButton() {
  return (
    <button
      onClick={() => {
        resetTestCookies()
      }}
    >
      Reset
    </button>
  )
}
