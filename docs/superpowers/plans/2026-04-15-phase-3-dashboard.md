# Phase 3: Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Prerequisite:** Phase 2 must be complete.

**Goal:** Build the authenticated sidebar dashboard layout — a persistent left sidebar listing the student's enrolled courses, with the selected course's units and materials in the main panel. Mobile gets a hamburger drawer.

---

### Task 1: Top navigation bar

**Files:** Create `components/nav/TopNav.tsx`

- [ ] Create `components/nav/TopNav.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface TopNavProps {
  userName: string
  onMenuClick?: () => void
}

export default function TopNav({ userName, onMenuClick }: TopNavProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="h-14 border-b border-white/10 bg-[#1a1a2e] flex items-center px-4 gap-4 shrink-0">
      <button onClick={onMenuClick} className="md:hidden text-white/60 hover:text-white p-1">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <Link href="/dashboard" className="font-bold text-white text-sm hidden md:block shrink-0">
        Success at Sage
      </Link>
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search courses and materials..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
        />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <Link href="/submit" className="hidden sm:block text-sm text-purple-400 hover:text-purple-300 font-medium">
          + Submit
        </Link>
        <Link href="/profile" className="text-sm text-white/60 hover:text-white">
          {userName}
        </Link>
        <button onClick={handleSignOut} className="text-sm text-white/40 hover:text-white/70">
          Sign out
        </button>
      </div>
    </header>
  )
}
```
- [ ] Commit:
```bash
git add components/nav/TopNav.tsx
git commit -m "feat: add top navigation bar with search"
```

---

### Task 2: Sidebar component

**Files:** Create `components/sidebar/Sidebar.tsx`

- [ ] Create `components/sidebar/Sidebar.tsx`:
```tsx
import Link from 'next/link'

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

export default function Sidebar({ courses, activeCourseSlug, onClose }: SidebarProps) {
  return (
    <nav className="w-64 shrink-0 h-full bg-[#16213e] border-r border-white/10 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">My Courses</span>
      </div>
      <div className="flex-1 py-2">
        {courses.length === 0 ? (
          <p className="px-4 py-3 text-sm text-white/30">No courses yet.</p>
        ) : (
          courses.map(course => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeCourseSlug === course.slug
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: course.department.colorAccent }} />
              <span className="truncate">{course.name}</span>
            </Link>
          ))
        )}
      </div>
      <div className="p-4 border-t border-white/10">
        <Link href="/browse" onClick={onClose} className="text-sm text-purple-400 hover:text-purple-300">
          + Browse Courses
        </Link>
      </div>
    </nav>
  )
}
```
- [ ] Commit:
```bash
git add components/sidebar/Sidebar.tsx
git commit -m "feat: add sidebar component"
```

---

### Task 3: Mobile drawer wrapper

**Files:** Create `components/sidebar/SidebarDrawer.tsx`

- [ ] Create `components/sidebar/SidebarDrawer.tsx`:
```tsx
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
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar courses={courses} activeCourseSlug={activeCourseSlug} onClose={onClose} />
      </div>
    </>
  )
}
```
- [ ] Commit:
```bash
git add components/sidebar/SidebarDrawer.tsx
git commit -m "feat: add mobile sidebar drawer"
```

---

### Task 4: Dashboard layout shell

**Files:** Create `app/(app)/layout.tsx`, create `app/(app)/dashboard/page.tsx`

- [ ] Create `app/(app)/layout.tsx`:
```tsx
import { requireUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import DashboardShell from '@/components/DashboardShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const userCourses = await getUserCourses(user.id)

  const courses = userCourses.map(({ course, department }) => ({
    id: course.id,
    name: course.name,
    slug: course.slug,
    department: { colorAccent: department.colorAccent, name: department.name },
  }))

  return (
    <DashboardShell courses={courses} userName={user.fullName}>
      {children}
    </DashboardShell>
  )
}
```
- [ ] Create `components/DashboardShell.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import TopNav from '@/components/nav/TopNav'
import Sidebar from '@/components/sidebar/Sidebar'
import SidebarDrawer from '@/components/sidebar/SidebarDrawer'

interface Course {
  id: string
  name: string
  slug: string
  department: { colorAccent: string; name: string }
}

interface DashboardShellProps {
  courses: Course[]
  userName: string
  children: React.ReactNode
}

export default function DashboardShell({ courses, userName, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const activeCourseSlug = pathname.match(/\/courses\/([^/]+)/)?.[1]

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e]">
      <TopNav userName={userName} onMenuClick={() => setDrawerOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar courses={courses} activeCourseSlug={activeCourseSlug} />
        </div>
        {/* Mobile drawer */}
        <SidebarDrawer
          courses={courses}
          activeCourseSlug={activeCourseSlug}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```
- [ ] Create `app/(app)/dashboard/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireUser()
  const userCourses = await getUserCourses(user.id)

  if (userCourses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <p className="text-white/50 text-lg">You haven&apos;t added any courses yet.</p>
        <Link href="/browse" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
          Browse Courses
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Courses</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userCourses.map(({ course, department }) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 transition-colors"
            style={{ borderColor: `${department.colorAccent}30` }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: department.colorAccent }}>
              {department.name}
            </div>
            <div className="text-white font-semibold">{course.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```
- [ ] Verify `/dashboard` renders correctly with sidebar and enrolled courses.
- [ ] Commit:
```bash
git add app/(app)/ components/DashboardShell.tsx
git commit -m "feat: add dashboard layout with sidebar and mobile drawer"
```

---

**Phase 3 complete.** Move on to Phase 4 (Content).
