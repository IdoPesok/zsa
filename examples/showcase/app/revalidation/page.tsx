import IncrementExample from "./increment-example"

export default async function RevalidationPage() {
  const random = Math.random()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return (
    <>
      {random}
      <IncrementExample />
    </>
  )
}
