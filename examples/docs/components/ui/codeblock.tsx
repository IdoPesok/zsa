// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Markdown/CodeBlock.tsx

"use client"

import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react"
import { CSSProperties, FC, memo } from "react"
import { highlight } from "sugar-high"

import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface Props {
  language: string
  value: string
  fileName?: string
  customStyles?: CSSProperties
  className?: string
  customTitle?: string
  highlightLineNumbers?: number[]
}

const programmingLanguages: Record<string, string> = {
  javascript: ".js",
  python: ".py",
  java: ".java",
  c: ".c",
  cpp: ".cpp",
  "c++": ".cpp",
  "c#": ".cs",
  ruby: ".rb",
  php: ".php",
  swift: ".swift",
  json: ".json",
  "objective-c": ".m",
  kotlin: ".kt",
  typescript: ".ts",
  go: ".go",
  perl: ".pl",
  rust: ".rs",
  scala: ".scala",
  haskell: ".hs",
  lua: ".lua",
  shell: ".sh",
  sql: ".sql",
  html: ".html",
  css: ".css",
  bash: ".sh",
}

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXY3456789" // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lowercase ? result.toLowerCase() : result
}

const CodeBlock: FC<Props> = memo(
  ({
    language,
    value,
    customStyles,
    className,
    customTitle,
    fileName,
    highlightLineNumbers,
  }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

    const downloadAsFile = () => {
      if (typeof window === "undefined") {
        return
      }
      const fileExtension = programmingLanguages[language] || ".file"
      const suggestedFileName = `file-${generateRandomString(
        3,
        true
      )}${fileExtension}`
      const fileName = window.prompt("Enter file name" || "", suggestedFileName)

      if (!fileName) {
        // User pressed cancel on prompt.
        return
      }

      const blob = new Blob([value], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = fileName
      link.href = url
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    const onCopy = () => {
      if (isCopied) return
      copyToClipboard(value)
    }

    let codeHTML = ""

    const highlightSet = new Set(highlightLineNumbers || [])
    const errorHighlightSet = new Set()
    const valueSplit = value.split("\n")
    for (let i = 0; i < valueSplit.length; i++) {
      const line = valueSplit[i]!
      if (line.includes("<|highlight|>")) {
        highlightSet.add(i + 1)
      }

      if (line.includes("<|error|>")) {
        errorHighlightSet.add(i + 1)
      }
    }

    value = value.replaceAll(" <|highlight|>", "")
    value = value.replaceAll(" <|error|>", "")

    // split code html into lines and add highlighting to the 5th line
    const split = highlight(value).split("\n")

    for (let i = 0; i < split.length; i++) {
      let line = split[i]!
      const baseClass = "sh__line"

      if (highlightSet.has(i + 1)) {
        line = line.replace(baseClass, `${baseClass} sh__line--highlighted`)
      }

      if (errorHighlightSet.has(i + 1)) {
        line = line.replace(
          baseClass,
          `${baseClass} sh__line--error-highlighted`
        )
      }

      codeHTML += `${line}\n`
    }

    return (
      <div
        className={cn(
          "codeblock prose-invert relative w-full rounded-sm dark:bg-muted bg-background font-sans border",
          className
        )}
      >
        <div className="flex w-full items-center justify-between dark:bg-background bg-muted px-6 py-2 pr-4 text-muted-foreground border-b rounded-t-sm">
          <span className="text-sm">
            {fileName && (
              <span className="bg-primary/20 text-primary py-1 px-2 rounded-sm mr-4">
                {fileName}
              </span>
            )}
            {customTitle || (language ?? "text")}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              className="hover:bg-gray-200 focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0 dark:hover:bg-muted"
              onClick={downloadAsFile}
              size="icon"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-xs hover:bg-gray-200 focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0 dark:hover:bg-muted"
              onClick={onCopy}
            >
              {isCopied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Copy code</span>
            </Button>
          </div>
        </div>
        <div className="bg-background dark:bg-muted p-5 pl-0 overflow-x-auto">
          <pre className="bg-transparent p-0 m-0 overflow-x-visible">
            <code
              style={{
                fontSize: "0.9rem",
                fontFamily: "var(--font-mono)",
                lineHeight: "1.5",
              }}
              className="overflow-x-visible"
              dangerouslySetInnerHTML={{ __html: codeHTML }}
            />
          </pre>
        </div>
      </div>
    )
  }
)
CodeBlock.displayName = "CodeBlock"

export { CodeBlock }
