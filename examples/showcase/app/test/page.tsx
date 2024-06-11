import { cookies } from "next/headers"
import ResetButton from "./reset-button"
import TestForm from "./test-form"

export default async function TestPage() {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const randomNumber = Math.floor(Math.random() * 10000)

  const isTesting = cookies().get("testing")?.value === "true"

  return (
    <div className="h-screen flex flex-col items-center justify-center w-screen">
      <div>isTesting: {isTesting.toString()}</div>
      <div>Random number: {randomNumber}</div>
      {!isTesting ? <TestForm /> : <ResetButton />}
    </div>
  )
}
