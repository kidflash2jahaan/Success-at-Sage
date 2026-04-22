export const dynamic = 'force-dynamic'

import { getCourseWithUnits, isUserEnrolled } from '@/lib/db/queries/courses'
import { getTrendingMaterialsForCourse } from '@/lib/db/queries/materials'
import { requireUser } from '@/lib/auth'
import { addCourseToSchedule, removeCourseFromSchedule } from '@/app/actions/courses'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SubmitButton from '@/components/ui/SubmitButton'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getCourseWithUnits(slug)
  if (!data) notFound()

  const { course, department, units, totalMaterials } = data
  const [user, trending] = await Promise.all([
    requireUser(),
    getTrendingMaterialsForCourse(course.id, 5),
  ])
  const enrolled = await isUserEnrolled(user.id, course.id)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

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

        <div className="mt-5 flex items-center gap-2 flex-wrap">
            <form action={enrolled
              ? removeCourseFromSchedule.bind(null, course.id)
              : addCourseToSchedule.bind(null, course.id)
            }>
              <SubmitButton
                pendingLabel={enrolled ? 'Removing...' : 'Adding...'}
                className={`btn-press px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-wait ${
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
              </SubmitButton>
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
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="animate-fade-up mb-5" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3.5 h-3.5 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Trending</h2>
          </div>
          <div className="flex flex-col gap-1.5">
            {trending.map((m, i) => (
              <Link
                key={m.id}
                href={`/courses/${slug}/units/${m.unitId}`}
                className="glass rounded-xl px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group"
              >
                <span className="text-white/20 text-xs font-bold w-4 shrink-0 tabular-nums">{i + 1}</span>
                <span className="flex-1 text-white/70 text-sm truncate group-hover:text-white transition-colors">{m.title}</span>
                <span className="text-white/25 text-xs shrink-0 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {m.viewCount.toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Units */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Units</h2>
          <div className="flex items-center gap-2 text-xs text-white/25">
            <span>{units.length} unit{units.length !== 1 ? 's' : ''}</span>
            <span className="text-white/15">·</span>
            <span>{totalMaterials} material{totalMaterials !== 1 ? 's' : ''}</span>
          </div>
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
                href={`/courses/${slug}/units/${unit.id}`}
                className="animate-fade-up card-hover glass rounded-xl px-5 py-4 flex items-center justify-between transition-all hover:bg-white/[0.07] hover:border-white/[0.13] group"
                style={{ animationDelay: `${0.15 + i * 0.055}s` }}
              >
                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{unit.title}</span>
                <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors flex items-center gap-2">
                  <span>{unit.materialCount} material{unit.materialCount !== 1 ? 's' : ''}</span>
                  <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
