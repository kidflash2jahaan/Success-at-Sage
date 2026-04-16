export const dynamic = 'force-dynamic'

import { getCourseWithUnits, isUserEnrolled } from '@/lib/db/queries/courses'
import { getCurrentUser } from '@/lib/auth'
import { addCourseToSchedule, removeCourseFromSchedule } from '@/app/actions/courses'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getCourseWithUnits(slug)
  if (!data) notFound()

  const { course, department, units } = data
  const user = await getCurrentUser()
  const enrolled = user ? await isUserEnrolled(user.id, course.id) : false

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: department.colorAccent }}>
        {department.name}
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">{course.name}</h1>
      {course.description && <p className="text-white/60 mb-8">{course.description}</p>}

      {user && (
        <form action={enrolled
          ? removeCourseFromSchedule.bind(null, course.id)
          : addCourseToSchedule.bind(null, course.id)
        } className="mb-8">
          <button
            type="submit"
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
              enrolled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'text-white'
            }`}
            style={enrolled ? {} : { background: department.colorAccent }}
          >
            {enrolled ? 'Remove from Schedule' : '+ Add to My Schedule'}
          </button>
        </form>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">Units</h2>
      {units.length === 0 ? (
        <p className="text-white/40">No units yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {units.map(unit => (
            <Link
              key={unit.id}
              href={user ? `/courses/${slug}/units/${unit.id}` : '/login'}
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition-colors"
            >
              <span className="text-white">{unit.title}</span>
              <span className="text-white/30 text-sm">View materials →</span>
            </Link>
          ))}
        </div>
      )}

      {!user && (
        <p className="mt-6 text-white/40 text-sm">
          <Link href="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link> to view materials and add this course to your schedule.
        </p>
      )}
    </div>
  )
}
