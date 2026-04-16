'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface SidebarCourse {
  id: string
  name: string
  slug: string
  department: { colorAccent: string; name: string }
}

interface SidebarProps {
  courses: SidebarCourse[]
  activeCourseSlug?: string
  onClose?: () => void
}

const STORAGE_KEY = 'sas_recent_slugs'
const MAX_RECENTS = 8

export default function Sidebar({ courses, activeCourseSlug, onClose }: SidebarProps) {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([])

  // Load recents from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      setRecentSlugs(Array.isArray(stored) ? stored : [])
    } catch {}
  }, [])

  // Push current course to recents whenever active slug changes
  useEffect(() => {
    if (!activeCourseSlug) return
    setRecentSlugs(prev => {
      const next = [activeCourseSlug, ...prev.filter(s => s !== activeCourseSlug)].slice(0, MAX_RECENTS)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [activeCourseSlug])

  // Build display list: recents first (filtered to enrolled), then unvisited enrolled courses
  const courseBySlug = Object.fromEntries(courses.map(c => [c.slug, c]))
  const recentCourses = recentSlugs.map(s => courseBySlug[s]).filter(Boolean) as SidebarCourse[]
  const visitedSlugs = new Set(recentSlugs)
  const unvisited = courses.filter(c => !visitedSlugs.has(c.slug))
  const displayCourses = [...recentCourses, ...unvisited]

  return (
    <nav className="glass-sidebar w-64 shrink-0 h-full flex flex-col overflow-y-auto">
      <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Recents</span>
        <Link
          href="/browse"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Browse & add courses"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 py-2 px-2">
        {displayCourses.length === 0 ? (
          <p className="px-3 py-3 text-sm text-white/25">No courses yet.</p>
        ) : (
          displayCourses.map(course => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              onClick={onClose}
              className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                activeCourseSlug === course.slug
                  ? 'glass text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: course.department.colorAccent, boxShadow: `0 0 6px ${course.department.colorAccent}80` }}
              />
              <span className="truncate">{course.name}</span>
            </Link>
          ))
        )}
      </div>
    </nav>
  )
}
