import { Button } from "@/components/ui/button"
import { DocsLayout } from "fumadocs-ui/layout"
import "fumadocs-ui/style.css"
import { Network, StarIcon } from "lucide-react"
import type { ReactNode } from "react"
import { pageTree } from "../source"

export default async function RootDocsLayout({
  children,
}: {
  children: ReactNode
}) {
  const data = await fetch("https://api.github.com/repos/idopesok/zsa")
  const stargazersCount = (await data.json()).stargazers_count

  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        githubUrl: "https://github.com/IdoPesok/zsa",
        title: (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Network className="size-5" />
              ZSA
            </div>
            <Button
              size={"sm"}
              variant={"secondary"}
              className="flex items-center gap-2"
            >
              Star us on GitHub!
              <StarIcon className="text-yellow-500 h-4 w-4" />
              {stargazersCount}
            </Button>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
