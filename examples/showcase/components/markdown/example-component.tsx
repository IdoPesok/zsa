import HelloWorld from "@/content/examples/hello-world-action/hello-world-action";
import IncrementExample from "@/content/examples/hello-world-action/increment-example";
import { memo } from "react";

function ExampleComponent({ id }: { id: string }) {
  switch (id) {
    case "hello-world-action":
      return <HelloWorld />
    case "increment-example":
      return <IncrementExample />
    default:
      return <div className="p-4 border rounded">{id}</div>
  }
}

export default memo(ExampleComponent)
