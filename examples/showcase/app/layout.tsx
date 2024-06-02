import { TooltipProvider } from "@/components/ui/tooltip"
import { RootProvider } from "fumadocs-ui/provider"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import { Toaster } from "sonner"
import ReactQueryProvider from "./_providers/react-query-provider"
import "./global.css"

const inter = Inter({
  subsets: ["latin"],
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <RootProvider>
          <ReactQueryProvider>
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            <Toaster duration={3000} />
          </ReactQueryProvider>
        </RootProvider>
      </body>
    </html>
  )
}
