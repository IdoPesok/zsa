import { TooltipProvider } from "@/components/ui/tooltip"
import { getDocPosts } from "@/lib/docs"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import SideNav from "./_components/side-nav"
import TopNav from "./_components/top-nav"
import ReactQueryProvider from "./_providers/react-query-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zod Server Actions",
  description: "Build scalable, lightweight server actions.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const docPosts = getDocPosts()

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overflow-y-scroll overflow-x-hidden  overscroll-none",
          inter
        )}
      >
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={0}>

              <div className="flex flex-col gap-6 overflow-hidden">
                <TopNav docPosts={docPosts} />
                <div className="flex flex-row gap-10 mx-2 sm:mx-10 px-4 max-w-screen-xl w-full pt-2 pb-4">
                  <SideNav docPosts={docPosts} />
                  <div className="flex-1 overflow-hidden max-w-full lg:pl-[270px] xl:flex flex-row gap-10 justify-end">
                    {children}
                  </div>
                </div>
              </div>
            </TooltipProvider>
            <Toaster duration={3000} />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
