'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Sidebar from './Sidebar'

interface SidebarCourse {
  id: string
  name: string
  slug: string
  department: { colorAccent: string; name: string }
}

interface SidebarDrawerProps {
  schoolSlug: string
  courses: SidebarCourse[]
  activeCourseSlug?: string
  open: boolean
  onClose: () => void
}

export default function SidebarDrawer({ schoolSlug, courses, activeCourseSlug, open, onClose }: SidebarDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={onClose}
            style={{ backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 md:hidden"
          >
            <Sidebar schoolSlug={schoolSlug} courses={courses} activeCourseSlug={activeCourseSlug} onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
