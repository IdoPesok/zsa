import { DocsLayout } from "fumadocs-ui/layout"
import "fumadocs-ui/style.css"
import { Network } from "lucide-react"
import type { ReactNode } from "react"
import { pageTree } from "../source"
import StargazersButton from "./_components/stargazers-button"

export const revalidate = 900 // revalidate every 15 minutes

export default async function RootDocsLayout({
  children,
}: {
  children: ReactNode
  }) {
  let stargazersCount=0
  // try {
  //   const data = await fetch("https://api.github.com/repos/IdoPesok/zsa")
  //    stargazersCount = (await data.json()).stargazers_count
    
  // } catch (error) {
  //   console.log("error");
    
  // }
 try {
    const data = await fetch("https://api.github.com/repos/IdoPesok/zsa");
    // Handle non-OK responses (e.g., 404, 500)
    if (!data.ok) {
      throw new Error(`HTTP Error: ${data.status} ${data.statusText}`);
    }
   stargazersCount = (await data.json()).stargazers_count
  } catch (error) {
    console.error("Error fetching stargazers count:", error);
  }
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        githubUrl: "https://github.com/IdoPesok/zsa",
        title: (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <Network className="size-5" />
              ZSA
            </span>
            <StargazersButton count={stargazersCount} />
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
