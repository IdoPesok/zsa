export default async function SlowPage() {
  // take 5 seconds to load
  await new Promise((resolve) => setTimeout(resolve, 5000))
  return "slow"
}
