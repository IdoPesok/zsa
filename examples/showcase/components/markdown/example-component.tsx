import { BasicForm } from "@/content/docs/examples/basic-form/basic-form-example"
import { BindFormExample } from "@/content/docs/examples/bind-form-example/bind-form-example"
import DocsPage from "@/content/docs/examples/docs/swagger-docs"
import { ExecuteFormAction } from "@/content/docs/examples/execute-form-action/execute-form-action"
import FormDataExample from "@/content/docs/examples/form-data/form-data-example"
import IncrementExample from "@/content/docs/examples/introduction/increment-example"
import MultiEntryExample from "@/content/docs/examples/multi-entry-example/multi-entry-example"
import { ReactHookForm } from "@/content/docs/examples/react-hook-form/react-hook-form-example"
import HelloWorld from "@/content/docs/examples/react-query/hello-world-action"
import RandomNumberExampleDisplay from "@/content/docs/examples/refetching-queries/random-number-example-display"
import RandomNumberExampleRefetch from "@/content/docs/examples/refetching-queries/random-number-example-refetch"
import UseActionStateExample from "@/content/docs/examples/use-action-state/use-action-state-example"
import UseActionStateSkipInputParsingExample from "@/content/docs/examples/use-action-state/use-action-state-skip-input-parsing-example"
import UseActionCustomStateExample from "@/content/docs/examples/use-form-state/use-form-state-example"
import { memo } from "react"

function ExampleComponent({ id }: { id: string }) {
  switch (id) {
    case "random-number-example-display":
      return <RandomNumberExampleDisplay />
    case "random-number-example-refetch":
      return <RandomNumberExampleRefetch />
    case "bind-form-example":
      return <BindFormExample />
    case "hello-world-action":
      return <HelloWorld />
    case "increment-example":
      return <IncrementExample />
    case "form-data":
      return <FormDataExample />
    case "use-form-state":
      return <UseActionCustomStateExample />
    case "use-action-state":
      return <UseActionStateExample />
    case "use-action-state-skip-input-parsing":
      return <UseActionStateSkipInputParsingExample />
    case "multi-entry":
      return <MultiEntryExample />
    case "basic-form":
      return <BasicForm />
    case "execute-form-action":
      return <ExecuteFormAction />
    case "react-hook-form":
      return <ReactHookForm />
    case "docs":
      return <DocsPage />
    default:
      return <div className="p-4 border rounded">{id}</div>
  }
}

export default memo(ExampleComponent)
