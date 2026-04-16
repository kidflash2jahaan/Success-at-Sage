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
    <nav className="glass-sidebar w-64 shrink-0 h-full flex flex-col overflow-y-auto">
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/30">My Courses</span>
      </div>

      <div className="flex-1 py-2 px-2">
        {courses.length === 0 ? (
          <p className="px-3 py-3 text-sm text-white/25">No courses yet.</p>
        ) : (
          courses.map(course => (
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

      <div className="p-4 border-t border-white/[0.06]">
        <Link
          href="/browse"
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors px-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Browse Courses
        </Link>
      </div>
    </nav>
  )
}
