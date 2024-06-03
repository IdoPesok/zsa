import { DocsLayout } from "fumadocs-ui/layout"
import "fumadocs-ui/style.css"
import { Network } from "lucide-react"
import type { ReactNode } from "react"
import { pageTree } from "../source"

export default async function RootDocsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        githubUrl: "https://github.com/IdoPesok/zsa",
        title: (
          <>
            <Network className="size-5" />
            ZSA
          </>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
