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
