export const dynamic = 'force-dynamic'

import { getCourseWithUnits, isUserEnrolled } from '@/lib/db/queries/courses'
import { getCurrentUser } from '@/lib/auth'
import { addCourseToSchedule, removeCourseFromSchedule } from '@/app/actions/courses'
import BackToDashboard from '@/components/BackToDashboard'
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
      {user && <BackToDashboard />}

      {/* Header */}
      <div className="animate-scale-in glass rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: department.colorAccent, boxShadow: `0 0 8px ${department.colorAccent}80` }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: department.colorAccent }}>
            {department.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight leading-snug">{course.name}</h1>
        {course.description && <p className="text-white/50 text-sm leading-relaxed">{course.description}</p>}

        {user && (
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <form action={enrolled
              ? removeCourseFromSchedule.bind(null, course.id)
              : addCourseToSchedule.bind(null, course.id)
            }>
              <button
                type="submit"
                className={`btn-press px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  enrolled
                    ? 'glass text-white/70 hover:text-white hover:bg-white/[0.08]'
                    : 'text-white hover:shadow-lg'
                }`}
                style={enrolled ? {} : {
                  background: department.colorAccent,
                  boxShadow: `0 0 20px ${department.colorAccent}40`,
                }}
              >
                {enrolled ? 'Remove from Schedule' : '+ Add to My Schedule'}
              </button>
            </form>
            <Link
              href={`/submit?course=${slug}`}
              className="btn-press inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold glass text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit Material
            </Link>
          </div>
        )}
      </div>

      {/* Units */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Units</h2>
          <span className="text-xs text-white/25">{units.length}</span>
        </div>
        {units.length === 0 ? (
          <div className="glass rounded-xl px-5 py-8 text-center text-white/25 text-sm">
            No units yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {units.map((unit, i) => (
              <Link
                key={unit.id}
                href={user ? `/courses/${slug}/units/${unit.id}` : '/login'}
                className="animate-fade-up card-hover glass rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:bg-white/[0.07] hover:border-white/[0.13] group"
                style={{ animationDelay: `${0.15 + i * 0.055}s` }}
              >
                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{unit.title}</span>
                <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors flex items-center gap-1">
                  View
                  <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <p className="mt-6 text-white/30 text-sm text-center">
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in</Link>{' '}
          to view materials and add this course to your schedule.
        </p>
      )}
    </div>
  )
}
