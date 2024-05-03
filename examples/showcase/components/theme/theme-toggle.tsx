"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import * as React from "react"

export function ThemeToggle({
  className,
  shortcutOnly = false,
}: {
  className?: string
  shortcutOnly?: boolean
}) {
  const [mounted, setMounted] = React.useState(false)
  const { setTheme, theme } = useTheme()

  // listen for keyboard shortcut to toggle theme
  React.useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      // quickly test theme using cmd + shift + /
      if (e.key === "/" && e.metaKey && e.shiftKey) {
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }

    window.addEventListener("keydown", listener)

    return () => window.removeEventListener("keydown", listener)
  }, [theme, setTheme])

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (shortcutOnly) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className={className}>
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
