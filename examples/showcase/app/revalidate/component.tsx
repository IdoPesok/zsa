"use client"

import IncrementExample from "@/content/docs/examples/introduction/increment-example"
import { useState } from "react"

export default function RevalidateComponent() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {open ? (
        <IncrementExample />
      ) : (
        <button onClick={() => setOpen(true)}>Open</button>
      )}
    </div>
  )
}
