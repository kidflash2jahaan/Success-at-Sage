'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import TopNav from '@/components/nav/TopNav'
import Sidebar from '@/components/sidebar/Sidebar'
import SidebarDrawer from '@/components/sidebar/SidebarDrawer'
import MobileNav from '@/components/nav/MobileNav'

interface Course {
  id: string
  name: string
  slug: string
  department: { colorAccent: string; name: string }
}

interface DashboardShellProps {
  schoolSlug: string
  displayShort: string
  courses: Course[]
  userName: string
  isAdmin?: boolean
  children: React.ReactNode
}

export default function DashboardShell({
  schoolSlug,
  displayShort,
  courses,
  userName,
  isAdmin,
  children,
}: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const activeCourseSlug = pathname.match(/\/courses\/([^/]+)/)?.[1]

  return (
    <div className="flex flex-col h-dvh">
      <TopNav
        schoolSlug={schoolSlug}
        displayShort={displayShort}
        userName={userName}
        isAdmin={isAdmin}
        onMenuClick={() => setDrawerOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar schoolSlug={schoolSlug} courses={courses} activeCourseSlug={activeCourseSlug} />
        </div>
        <SidebarDrawer
          schoolSlug={schoolSlug}
          courses={courses}
          activeCourseSlug={activeCourseSlug}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav schoolSlug={schoolSlug} />
    </div>
  )
}
