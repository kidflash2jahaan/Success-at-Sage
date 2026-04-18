export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import SubmitForm from '@/components/submit/SubmitForm'
import Link from 'next/link'

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; unit?: string }>
}) {
  await requireUser()
  const { course: preselectedSlug, unit: preselectedUnitId } = await searchParams
  const [{ data: coursesData }, { data: unitsData }, { data: contestSettings }] = await Promise.all([
    supabaseAdmin.from('courses').select('id, name, slug').order('name'),
    supabaseAdmin.from('units').select('id, title, course_id').eq('status', 'approved').order('title'),
    supabaseAdmin.from('contest_settings').select('prize_description, next_reset_date').eq('id', 1).single(),
  ])

  const settings = contestSettings as { prize_description?: string; next_reset_date?: string } | null
  const prize = settings?.prize_description ?? '$25 Amazon gift card'
  const resetDate = settings?.next_reset_date
    ? new Date(settings.next_reset_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/leaderboard" className="block mb-6 glass border border-amber-500/20 hover:border-amber-500/40 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3 transition-colors group">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🎁</span>
          <span className="text-white/70 text-sm">
            Each approved submission enters you to win a <span className="text-amber-400 font-semibold">{prize}</span>
            {resetDate ? <span className="text-white/30"> · Resets {resetDate}</span> : ''}
          </span>
        </div>
        <span className="text-white/25 group-hover:text-amber-400 text-xs transition-colors shrink-0">Leaderboard →</span>
      </Link>
      <SubmitForm
        courses={(coursesData ?? []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))}
        units={(unitsData ?? []).map((u: any) => ({ id: u.id, title: u.title, courseId: u.course_id }))}
        preselectedSlug={preselectedSlug}
        preselectedUnitId={preselectedUnitId}
      />
    </div>
  )
}
