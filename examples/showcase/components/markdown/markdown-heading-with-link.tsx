"use client"

import { cn, slugify } from "@/lib/utils"
import { LinkIcon } from "lucide-react"

export default function MarkdownHeadingWithLink(
  props: React.ButtonHTMLAttributes<HTMLHeadingElement> & {
    tagname?: "H1" | "H2" | "H3" | "H4" | "H5" | "H6"
  }
) {
  const id =
    typeof props.children === "string" ? slugify(props.children) : undefined

  const children = (
    <>
      {props.children}
      <a
        className="group-hover:visible invisible border animate-fade rounded p-1 hover:opacity-80 transiation-opacity bg-muted text-primary absolute font-bold top-[4px] left-[-32.5px]"
        href="#"
      >
        <LinkIcon className="h-3 w-3" />
      </a>
    </>
  )

  const headingProps: React.HtmlHTMLAttributes<HTMLHeadingElement> = {
    ...props,
    id,
    className: cn(
      props.className,
      "group relative cursor-pointer markdown-heading"
    ),
    onClick: (e) => {
      e.preventDefault()
      const target = document.getElementById(id || "na")
      if (target) {
        target.scrollIntoView({ behavior: "smooth" })
      }

      // copy the url to the clipboard
      const currentUrl = window.location.href
      navigator.clipboard.writeText(currentUrl + "#" + id)
    },
  }

  if (props.tagname === "H3") {
    return <h3 {...headingProps}>{children}</h3>
  }

  return <h2 {...headingProps}>{children}</h2>
}
