"use client"

import { useFormState } from "react-dom"
import { multiEntryStateAction, stateInputAction } from "server/actions"

const UseActionStateUI = () => {
  const [[data, err], submit, isPending] = useFormState(stateInputAction, [
    null,
    null,
  ])

  return (
    <div>
      <form action={submit}>
        <input type="number" name="number" required />
        <button>Invoke Action</button>
      </form>
      <div>
        {data && <div id="data">{JSON.stringify(data)}</div>}
        {err && <div id="error">{JSON.stringify(err.fieldErrors)}</div>}
      </div>
    </div>
  )
}

const MultiEntryFormUI = () => {
  const [[data, err], submit, isPending] = useFormState(multiEntryStateAction, [
    null,
    null,
  ])

  return (
    <div>
      <form action={submit}>
        <input type="text" id="name-1" name="name" />
        <input type="text" id="name-2" name="name" />
        <button>Invoke Action</button>
      </form>
      <div>
        {data && <div id="data">{JSON.stringify(data)}</div>}
        {err && <div id="error">{JSON.stringify(err.fieldErrors)}</div>}
      </div>
    </div>
  )
}

export default function UseActionStatePage(props: {
  searchParams: { id: string }
}) {
  if (props.searchParams.id === "multientry") {
    return <MultiEntryFormUI />
  }

  return <UseActionStateUI />
}
