"use client"

import { Button } from "@/components/ui/button"
import { StarIcon } from "lucide-react"

export default function StargazersButton({ count }: { count: number }) {
  return (
    <Button
      size={"sm"}
      variant={"secondary"}
      className="flex items-center gap-2 border text-muted-foreground hover:text-foreground transition-colors duration-200"
      onClick={() => {
        // link component kept throwing hydration errors
        window.open("https://github.com/IdoPesok/zsa/stargazers", "_blank")
      }}
    >
      <StarIcon className="text-yellow-500 h-4 w-4" />
      Stars
      <span className="rounded-full px-2 py-0.5 bg-background border text-xs">
        {count + " "}
      </span>
    </Button>
  )
}
