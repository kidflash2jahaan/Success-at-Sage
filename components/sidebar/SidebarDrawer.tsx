'use client'
import { useEffect } from 'react'
import Sidebar from './Sidebar'

interface SidebarCourse {
  id: string
  name: string
  slug: string
  department: { colorAccent: string; name: string }
}

interface SidebarDrawerProps {
  courses: SidebarCourse[]
  activeCourseSlug?: string
  open: boolean
  onClose: () => void
}

export default function SidebarDrawer({ courses, activeCourseSlug, open, onClose }: SidebarDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar courses={courses} activeCourseSlug={activeCourseSlug} onClose={onClose} />
      </div>
    </>
  )
}
