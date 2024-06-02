import { getPage, getPages } from "@/app/source"
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"
import { DocsBody, DocsPage } from "fumadocs-ui/page"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export default async function Page({
  params,
}: {
  params: { slug?: string[] }
}) {
  const page = getPage(params.slug)

  if (page == null) {
    notFound()
  }

  const MDX = page.data.exports.default

  return (
    <DocsPage toc={page.data.exports.toc}>
      <DocsBody>
        <h1>{page.data.title}</h1>
        <MDX
          components={{
            pre: ({ ref: _ref, title, ...props }) => (
              <CodeBlock title={title}>
                <Pre {...props} />
              </CodeBlock>
            ),
          }}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return getPages().map((page) => ({
    slug: page.slugs,
  }))
}

export function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = getPage(params.slug)

  if (page == null) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  } satisfies Metadata
}
