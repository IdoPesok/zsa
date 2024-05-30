import { redirect } from "next/navigation"

export default async function Home() {
  return redirect("/introduction")
}
