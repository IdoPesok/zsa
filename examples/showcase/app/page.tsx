import ClientPlayground from "@/components/client-playground"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getFakeData } from "@/server/actions"
import { Suspense } from "react"

const RandomNumbers = async () => {
  const [data, err] = await getFakeData(undefined)

  if (err) {
    return <div>{JSON.stringify(err)}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call From Server Component</CardTitle>
        <CardDescription>
          This card fetched data from a server component and showed the loading
          state using {" <Suspense />"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}

export default async function PlaygroundPage() {
  return (
    <div className="max-w-screen-lg py-10 mx-auto flex flex-col gap-10">
      <h1 className="text-3xl font-bold text-center">
        Server Actions Wrapper Playground
      </h1>
      <div className="grid lg:grid-cols-2 grid-cols-1 md:grid-cols-2 gap-10 w-full">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <RandomNumbers />
        </Suspense>
        {/* <ClientPlayground /> */}
      </div>
    </div>
  )
}
