import ClientPlayground from "@/components/client-playground"
import { getFakeData } from "@/server/actions"

export default async function PlaygroundPage() {
  const [data, err] = await getFakeData(undefined)

  if (err) {
    return <div>{JSON.stringify(err)}</div>
  }

  return (
    <div className="max-w-height mx-auto flex max-w-screen-sm flex-col gap-4 overflow-y-auto">
      <h1>Playground</h1>
      <div className="flex flex-1 flex-row gap-4">
        <div className="flex flex-1 flex-col gap-4">
          {data.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <ClientPlayground />
        </div>
      </div>
    </div>
  )
}
