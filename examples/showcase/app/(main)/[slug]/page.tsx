import MarkdownContainer from "@/components/markdown/markdown-container"
import { Button } from "@/components/ui/button"
import { getDocPosts } from "@/lib/docs"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DocPageOutline } from "../_components/outline"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = getDocPosts().find((post) => post.slug === params.slug)
  if (!post) notFound()

  return {
    title: `zsa - ${post.metadata.title}`,
    description: `${post.metadata.summary}`,
    openGraph: {
      title: `${post.metadata.title}`,
      description: `${post.metadata.summary}`,
    },
  }
}

export default function Blog({ params }: { params: { slug: string } }) {
  const docPosts = getDocPosts()
  const foundIx = docPosts.findIndex((post) => post.slug === params.slug)
  const post = docPosts[foundIx]

  if (!post) {
    notFound()
  }

  const previousDoc = foundIx - 1
  const nextDoc = foundIx + 1

  return (
    <>
      <div className="w-full">
        <MarkdownContainer source={post.content} />
        <div className="flex flex-row border-t border-muted justify-between items-center py-10 prose">
          <div>
            {previousDoc >= 0 && (
              <Link href={`/${docPosts[previousDoc]!.slug}`}>
                <Button variant={"link"} className="px-0">
                  <ChevronLeft className="h-4 w-4" />
                  {docPosts[previousDoc]!.metadata.title}
                </Button>
              </Link>
            )}
          </div>
          <div>
            {nextDoc < docPosts.length && (
              <Link href={`/${docPosts[nextDoc]!.slug}`}>
                <Button variant={"link"} className="px-0">
                  {docPosts[nextDoc]!.metadata.title}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      <DocPageOutline headingElements={post.headingElements} />
    </>
  )
}
