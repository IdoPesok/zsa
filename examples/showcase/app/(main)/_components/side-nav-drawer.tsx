import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { getDocPosts } from "@/lib/docs"
import { Menu } from "lucide-react"
import { useState } from "react"
import SideNav from "./side-nav"

export default function SideNavDrawer({
  docPosts,
}: {
  docPosts: ReturnType<typeof getDocPosts>
}) {
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild className="flex sm:hidden">
        <Button size={"icon"} variant={"outline"}>
          <Menu className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto m-10 w-full max-w-sm">
          <div className="px-8 pb-0" onClick={() => setOpen(false)}>
            <SideNav docPosts={docPosts} className="relative contents py-20" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
