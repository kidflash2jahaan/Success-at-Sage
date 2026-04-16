export const dynamic = 'force-dynamic'

import { getAllDepartmentsWithCourses } from '@/lib/db/queries/courses'
import { getCurrentUser } from '@/lib/auth'
import BackToDashboard from '@/components/BackToDashboard'
import Link from 'next/link'

export default async function BrowsePage() {
  const [departments, user] = await Promise.all([
    getAllDepartmentsWithCourses(),
    getCurrentUser().catch(() => null),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {user && <BackToDashboard />}
      <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Browse Courses</h1>
      <p className="text-white/40 mb-10 text-sm">Find your courses and add them to your schedule.</p>

      <div className="flex flex-col gap-10">
        {departments.map((dept, di) => (
          <div key={dept.id} className="animate-fade-up" style={{ animationDelay: `${di * 0.07}s` }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: dept.colorAccent, boxShadow: `0 0 10px ${dept.colorAccent}70` }}
              />
              <h2 className="text-base font-semibold text-white tracking-tight">{dept.name}</h2>
              <span className="text-xs text-white/25 ml-1">{dept.courses.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {dept.courses.map((course: any, ci: number) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="card-hover glass rounded-xl p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.13] group"
                  style={{ animationDelay: `${di * 0.07 + ci * 0.04}s` }}
                >
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: dept.colorAccent }}>
                    {dept.name}
                  </div>
                  <div className="text-white/90 text-sm font-medium leading-snug group-hover:text-white transition-colors">
                    {course.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
