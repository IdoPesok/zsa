"use client"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { ThemedImage } from "@/components/ui/themed-image"
import { getDocPosts } from "@/lib/docs"
import { cn } from "@/lib/utils"
import { Coffee, GithubIcon, TwitterIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function TopNav({
    docPosts,
}: {
    docPosts: ReturnType<typeof getDocPosts>
}) {
    const pathname = usePathname()

    return (
        <div className="sticky h-fit top-0 bg-background/80 backdrop-blur z-20  overscroll-none">
            <div className="border-b border-muted flex flex-row gap-10 items-center w-full px-10 max-w-screen py-4">
                <h3 className="whitespace-nowrap font-bold flex gap-3 items-center">
                    <Coffee className="size-5" />
                    Server Actions
                </h3>
                <div className="flex-1 flex-row gap-8 items-center px-4  text-sm font-medium">
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
                    <Link
                        href="https://github.com/"
                        passHref
                        target="_blank"
                        rel="noopener"
                    >
                        <Button size={"icon"} variant={"outline"}>
                            <GithubIcon className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link
                        href="https://twitter.com/"
                        passHref
                        target="_blank"
                        rel="noopener"
                    >
                        <Button size={"icon"} variant={"outline"}>
                            <TwitterIcon className="h-4 w-4" />
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>
            </div>
        </div>
    )
}