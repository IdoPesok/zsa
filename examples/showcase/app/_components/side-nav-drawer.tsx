

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Menu } from "lucide-react"
import { getDocPosts } from "@/lib/docs"
import SideNav from "./side-nav"
import { useState } from "react"

export default function SideNavDrawer({
    docPosts,
}: {
    docPosts: ReturnType<typeof getDocPosts>
}) {
    const [open, setOpen] = useState(false);

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild className="flex sm:hidden">
                <Button size={"icon"} variant={"outline"}>
                    <Menu className="h-4 w-4" />
                </Button>
            </DrawerTrigger>
            <DrawerContent >
                <div className="mx-auto m-10 w-full max-w-sm">

                    <div className="p-4 pb-0" onClick={() => setOpen(false)}>
                        <SideNav docPosts={docPosts} className="relative contents py-20" />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
