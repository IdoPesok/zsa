import { Check, Info, Note, Tip, Warning } from "@/components/ui/callout"
import { CodeBlock } from "@/components/ui/codeblock"
import { ResponseField } from "@/components/ui/response-field"
import { cn } from "@/lib/utils"
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote/rsc"
import Link from "next/link"
import ExampleComponent from "./example-component"
import MarkdownHeadingWithLink from "./markdown-heading-with-link"
import { MarkdownTooltip } from "./markdown-tooltip"

export default function MarkdownContainer(props: MDXRemoteProps) {
  function Table({
    data,
  }: {
    data: {
      headers: string[]
      rows: string[][]
    }
  }) {
    let headers = data.headers.map((header, index) => (
      <th key={index}>{header}</th>
    ))
    let rows = data.rows.map((row, index) => (
      <tr key={index}>
        {row.map((cell, cellIndex) => (
          <td key={cellIndex}>{cell}</td>
        ))}
      </tr>
    ))

    return (
      <table>
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    )
  }

  const components: MDXRemoteProps["components"] = {
    Info: ({ children }) => <Info>{children}</Info>,
    Table,
    Check: ({ children }) => <Check>{children}</Check>,
    Tip: ({ children }) => <Tip>{children}</Tip>,
    Warning: ({ children }) => <Warning>{children}</Warning>,
    Note: ({ children }) => <Note>{children}</Note>,
    ExampleComponent: ({ id }) => <ExampleComponent id={id} />,
    ResponseField: (props) => <ResponseField {...props} />,
    h2: (props) => <MarkdownHeadingWithLink {...props} tagname="H2" />,
    h3: (props) => <MarkdownHeadingWithLink {...props} tagname="H3" />,
    Tooltip: (props) => <MarkdownTooltip {...props} />,
    a: (props) => {
      const href = props.href as string
      const className = cn(
        props.className,
        "font-bold border-b border-primary !no-underline text-foreground"
      )

      const finalProps = { ...props, className }

      if (href.startsWith("/")) {
        return (
          <Link href={href} {...finalProps} ref={undefined}>
            {props.children}
          </Link>
        )
      }

      if (!href.startsWith("#")) {
        finalProps.target = "_blank"
        finalProps.rel = "noopener noreferrer"
      }

      return <a {...finalProps} />
    },
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "")

      if (!match && className !== "language-text") {
        return (
          <code
            className={cn(
              "bg-muted text-muted-foreground rounded px-1 py-0.5 font-mono text-sm border",
              className
            )}
            {...props}
          >
            {children}
          </code>
        )
      }

      const cnSplit = className?.split(":")
      const fileName = cnSplit?.[1]
      const highlightLineNumbers = cnSplit?.[2]?.split(",").map((n) => +n)

      return (
        <CodeBlock
          language={(match && match[1]) || ""}
          value={String(children).replace(/\n$/, "")}
          {...props}
          fileName={fileName}
          highlightLineNumbers={highlightLineNumbers}
        />
      )
    },
  }

  return (
    <div className="prose break-words leading-7 dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 pb-10">
      <MDXRemote {...props} components={components} />
    </div>
  )
}
