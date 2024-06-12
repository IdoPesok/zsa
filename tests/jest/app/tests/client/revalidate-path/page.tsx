import TestForm from "./form"

export default async function TestPage() {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const randomNumber = Math.floor(Math.random() * 10000)

  return (
    <div className="h-screen flex flex-col items-center justify-center w-screen">
      <div id="random-number">{randomNumber}</div>
      <TestForm />
    </div>
  )
}
