export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireUser()
  const [userCourses, { data: contestSettings }] = await Promise.all([
    getUserCourses(user.id),
    supabaseAdmin.from('contest_settings').select('prize_description, next_reset_date').eq('id', 1).single(),
  ])
  const prize = (contestSettings as any)?.prize_description ?? '$25 Amazon gift card'
  const resetDate = (contestSettings as any)?.next_reset_date
    ? new Date((contestSettings as any).next_reset_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  if (userCourses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-8">
        <div className="glass rounded-2xl p-10 max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl glass mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.25))' }}>
            <svg className="w-6 h-6 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-white/60 text-sm mb-6">You haven&apos;t added any courses yet. Browse the catalog to get started.</p>
          <Link href="/browse"
            className="btn-press inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]">
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Contest banner */}
      <Link href="/leaderboard" className="animate-fade-up block mb-6 glass border border-amber-500/20 hover:border-amber-500/40 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 transition-colors group">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-white font-semibold text-sm">Win a {prize} this month</div>
            <div className="text-white/40 text-xs mt-0.5">
              Submit approved notes to climb the leaderboard{resetDate ? ` · Resets ${resetDate}` : ''}
            </div>
          </div>
        </div>
        <span className="text-amber-400/60 group-hover:text-amber-400 text-sm transition-colors shrink-0">View rankings →</span>
      </Link>

      <div className="animate-fade-up mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Courses</h1>
          <p className="text-white/40 text-sm mt-1">{userCourses.length} course{userCourses.length !== 1 ? 's' : ''} in your schedule</p>
        </div>
        <Link href="/browse" className="btn-press mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/30 hover:text-white glass px-3 py-2 rounded-xl transition-all hover:bg-white/[0.07]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Courses
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {userCourses.map(({ course, department }, i) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="animate-fade-up card-hover glass rounded-2xl p-5 transition-all hover:bg-white/[0.07] hover:border-white/[0.14] group"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: department.colorAccent, boxShadow: `0 0 8px ${department.colorAccent}80` }}
              />
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: department.colorAccent }}>
                {department.name}
              </div>
            </div>
            <div className="text-white font-semibold leading-snug group-hover:text-white/90">{course.name}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-white/25">{course.unitCount} unit{course.unitCount !== 1 ? 's' : ''}</span>
              <span className="text-white/15 text-[11px]">·</span>
              <span className="text-[11px] text-white/25">{course.materialCount} material{course.materialCount !== 1 ? 's' : ''}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
