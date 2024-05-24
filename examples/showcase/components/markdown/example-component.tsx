import FormDataExample from "@/content/examples/form-data/form-data-example"
import IncrementExample from "@/content/examples/introduction/increment-example"
import HelloWorld from "@/content/examples/react-query/hello-world-action"
import RandomNumberExampleDisplay from "@/content/examples/refetching-queries/random-number-example-display"
import RandomNumberExampleRefetch from "@/content/examples/refetching-queries/random-number-example-refetch"
import UseFormStateExample from "@/content/examples/use-form-state/use-form-state-example"
import { memo } from "react"

function ExampleComponent({ id }: { id: string }) {
  switch (id) {
    case "random-number-example-display":
      return <RandomNumberExampleDisplay />
    case "random-number-example-refetch":
      return <RandomNumberExampleRefetch />
    case "hello-world-action":
      return <HelloWorld />
    case "increment-example":
      return <IncrementExample />
    case "form-data":
      return <FormDataExample />
    case "use-form-state":
      return <UseFormStateExample />
    default:
      return <div className="p-4 border rounded">{id}</div>
  }
}

export default memo(ExampleComponent)
