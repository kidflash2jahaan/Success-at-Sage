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
