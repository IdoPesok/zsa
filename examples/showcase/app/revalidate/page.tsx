import RevalidateComponent from "./component"

export default async function RevalidatePage() {
  // sleep for 2 seconds
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const randomNumber = Math.floor(Math.random() * 10000)

  return (
    <div>
      <h1>Revalidate Page</h1>
      <p>Random number: {randomNumber}</p>
      <RevalidateComponent />
    </div>
  )
}
