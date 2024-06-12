"use client"

import { resetTestCookies } from "./actions"

export default function ResetButton() {
  return (
    <button
      id="reset-button"
      onClick={() => {
        resetTestCookies()
      }}
    >
      Reset
    </button>
  )
}
