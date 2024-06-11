export default async function TestPage() {
  await new Promise((resolve) => setTimeout(resolve, 10000))
  const randomNumber = Math.floor(Math.random() * 10000)

  return (
    <div className="h-screen flex flex-col items-center justify-center w-screen">
      <div>Random number: {randomNumber}</div>
    </div>
  )
}
