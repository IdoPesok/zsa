"use client"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { getDocPosts } from "@/lib/docs"
import { cn } from "@/lib/utils"
import { GithubIcon, Network } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import SideNavDrawer from "./side-nav-drawer"

export default function TopNav({
  docPosts,
}: {
  docPosts: ReturnType<typeof getDocPosts>
}) {
  const pathname = usePathname()

  return (
    <div className="fixed w-screen h-fit top-0 bg-background/80 backdrop-blur z-20  overscroll-none">
      <div className="border-b border-muted flex flex-row gap-10 items-center w-full px-10 max-w-screen py-4 sm:justify-start justify-between">
        <Link passHref href="/introduction">
          <h3 className="whitespace-nowrap font-bold flex gap-3 items-center">
            <Network className="size-5" />
            ZSA
          </h3>
        </Link>

        <div className="flex-1 flex-row gap-8 items-center px-4 text-sm font-medium hidden sm:flex">
          <Link
            href="/introduction"
            className={cn(
              "border-b-2 py-2 border-transparent hover:border-muted text-muted-foreground hover:text-foreground",
              !pathname.includes("/actions/") &&
                "border-primary hover:border-primary text-foreground"
            )}
          >
            Documentation
          </Link>
        </div>
        <div className="flex justify-end gap-2 items-center">
          <SideNavDrawer docPosts={docPosts} />
          <Link
            href="https://github.com/IdoPesok/zsa"
            passHref
            target="_blank"
            rel="noopener"
            className="hidden sm:flex"
          >
            <Button size={"icon"} variant={"outline"}>
              <GithubIcon className="h-4 w-4" />
            </Button>
          </Link>
          <ThemeToggle className="hidden sm:flex" />
        </div>
      </div>
    </div>
  )
}
