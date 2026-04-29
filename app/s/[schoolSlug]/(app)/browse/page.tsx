export const dynamic = 'force-dynamic'

import { getAllDepartmentsWithCourses } from '@/lib/db/queries/courses'
import { resolveTenantBySlug } from '@/lib/tenant'
import Link from 'next/link'
import MotionFadeUp from '@/components/motion/MotionFadeUp'
import { MotionStagger, MotionItem } from '@/components/motion/MotionStagger'
import MotionCard from '@/components/motion/MotionCard'

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const departments = await getAllDepartmentsWithCourses(tenant.id)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <MotionFadeUp>
        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Browse Courses</h1>
        <p className="text-white/40 mb-10 text-sm">Find your courses and add them to your schedule.</p>
      </MotionFadeUp>

      {departments.length === 0 && (
        <MotionFadeUp delay={0.1}>
          <div className="glass rounded-2xl px-6 py-14 text-center">
            <p className="text-white/40 text-sm mb-2">No courses are set up yet for {tenant.displayShort}.</p>
            <p className="text-white/25 text-xs">Ask a school admin to add departments and courses.</p>
          </div>
        </MotionFadeUp>
      )}

      <div className="flex flex-col gap-10">
        {departments.map((dept, di) => (
          <MotionFadeUp key={dept.id} delay={0.08 + di * 0.07}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: dept.colorAccent, boxShadow: `0 0 10px ${dept.colorAccent}70`, animation: 'glow-pulse 3s ease-in-out infinite' }}
              />
              <h2 className="text-base font-semibold text-white tracking-tight">{dept.name}</h2>
              <span className="text-xs text-white/25 ml-1">{dept.courses.length}</span>
            </div>
            <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" staggerChildren={0.04} delayChildren={0.05}>
              {dept.courses.map(course => (
                <MotionItem key={course.id}>
                  <MotionCard
                    href={`/s/${schoolSlug}/courses/${course.slug}`}
                    className="card-hover glass rounded-xl p-4 transition-all hover:bg-white/[0.07] hover:border-white/[0.13] group block"
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: dept.colorAccent }}>
                      {dept.name}
                    </div>
                    <div className="text-white/90 text-sm font-medium leading-snug group-hover:text-white transition-colors mb-2">
                      {course.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25">{course.unitCount} unit{course.unitCount !== 1 ? 's' : ''}</span>
                      <span className="text-white/15 text-[10px]">·</span>
                      <span className="text-[10px] text-white/25">{course.materialCount} material{course.materialCount !== 1 ? 's' : ''}</span>
                    </div>
                  </MotionCard>
                </MotionItem>
              ))}
            </MotionStagger>
          </MotionFadeUp>
        ))}
      </div>
    </div>
  )
}
