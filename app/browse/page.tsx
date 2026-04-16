import { getAllDepartmentsWithCourses } from '@/lib/db/queries/courses'
import Link from 'next/link'

export default async function BrowsePage() {
  const departments = await getAllDepartmentsWithCourses()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">Browse Courses</h1>
      <p className="text-white/50 mb-10">Find your courses and add them to your schedule.</p>
      <div className="flex flex-col gap-10">
        {departments.map(dept => (
          <div key={dept.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: dept.colorAccent }} />
              <h2 className="text-xl font-semibold text-white">{dept.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dept.courses.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: dept.colorAccent }}>
                    {dept.name}
                  </div>
                  <div className="text-white font-medium">{course.name}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
