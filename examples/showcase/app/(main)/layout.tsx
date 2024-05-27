import { getDocPosts } from "@/lib/docs"
import SideNav from "./_components/side-nav"
import TopNav from "./_components/top-nav"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const docPosts = getDocPosts()

  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      <TopNav docPosts={docPosts} />
      <div className="flex flex-row gap-10 mx-2 sm:mx-10 px-4 max-w-screen-xl w-full pt-2 pb-4">
        <SideNav docPosts={docPosts} />
        <div className="flex-1 overflow-hidden max-w-full lg:pl-[270px] xl:flex flex-row gap-10 justify-end">
          {children}
        </div>
      </div>
    </div>
  )
}
