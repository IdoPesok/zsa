import { ReactNode, isValidElement } from "react"

export function MarkdownTooltip({
  tip,
  children,
}: {
  tip: string
  children: ReactNode
}) {
  if (!children) {
    return null
  }

  return (
    <span className="group z-10 inline relative">
      {underlineWhenTextOnly(children)}
      <span className="hidden group-hover:flex w-fit lg:whitespace-nowrap absolute bottom-full left-1/2 mb-0.5 pb-1 -translate-x-1/2 bg-codeblock text-center text-slate-50 text-xs px-1.5 py-1 rounded-lg border border-zinc-50">
        {tip}
      </span>
    </span>
  )
}

function underlineWhenTextOnly(children: ReactNode) {
  if (isValidElement(children)) {
    return children
  }

  return (
    <span className="underline decoration-dotted decoration-2 underline-offset-4 decoration-zinc-400 dark:decoration-zinc-500">
      {children}
    </span>
  )
}
