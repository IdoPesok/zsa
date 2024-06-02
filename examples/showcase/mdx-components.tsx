import { File, Files, Folder } from "fumadocs-ui/components/files"
import defaultComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import ExampleComponent from "./components/markdown/example-component"
import { Check, Info, Note, Tip, Warning } from "./components/ui/callout"
import { Table } from "./components/ui/table"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ExampleComponent: ({ id }) => <ExampleComponent id={id} />,
    Info: ({ children }) => <Info>{children}</Info>,
    Table,
    Check: ({ children }) => <Check>{children}</Check>,
    Tip: ({ children }) => <Tip>{children}</Tip>,
    Warning: ({ children }) => <Warning>{children}</Warning>,
    Note: ({ children }) => <Note>{children}</Note>,
    File: (props) => <File {...props} />,
    Folder: (props) => <Folder {...props} />,
    Files: (props) => <Files {...props} />,
    ...defaultComponents,
    ...components,
  }
}
