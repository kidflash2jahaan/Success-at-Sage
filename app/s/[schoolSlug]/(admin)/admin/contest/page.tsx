export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import { requireAdmin, calculateGrade } from '@/lib/auth'
import { chooseContestWinner, markWinnerPaid, updateContestSettings } from '@/app/actions/admin'
import { redirect } from 'next/navigation'
import SubmitButton from '@/components/ui/SubmitButton'
import MarketingAssets from './MarketingAssets'

export default async function AdminContestPage({ params, searchParams }: { params: Promise<{ schoolSlug: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin()
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const { saved } = await searchParams

  const today = new Date().toISOString().split('T')[0]
  const [{ data: settingsData }, { data: winnersData }] = await Promise.all([
    supabaseAdmin.from('contest_settings').select('*').eq('school_id', tenant.id).single(),
    supabaseAdmin
      .from('contest_winners')
      .select('*, users(full_name, email)')
      .eq('school_id', tenant.id)
      .order('created_at', { ascending: false }),
  ])

  const settings = (settingsData ?? { period_start: today, next_reset_date: today, prize_description: '$50 Amazon gift card' }) as {
    period_start: string
    next_reset_date: string | null
    prize_description: string
  }

  const { data: leaderDataFinal } = await supabaseAdmin.rpc('get_leaderboard_period', {
    p_start: settings.period_start,
    p_end: settings.next_reset_date ?? today,
  })
  const winners = (winnersData ?? []) as Array<{
    id: string
    users: { full_name: string; email: string } | null
    period_label: string
    paid_at: string | null
  }>
  const unpaidWinners = winners.filter(w => !w.paid_at)
  const paidWinners = winners.filter(w => w.paid_at)
  const leaders = (leaderDataFinal ?? []) as Array<{
    id: string
    full_name: string
    graduating_year: number
    submission_count: number
    total_views: number
  }>
  const currentLeader = leaders[0]

  const periodLabel = new Date(settings.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })

  async function handleChooseWinner(formData: FormData) {
    'use server'
    const userId = formData.get('userId') as string
    const label = formData.get('periodLabel') as string
    const start = formData.get('periodStart') as string
    const end = formData.get('periodEnd') as string
    await chooseContestWinner(userId, label, start, end)
    redirect('/admin/contest')
  }

  async function handleUpdateSettings(formData: FormData) {
    'use server'
    const nextReset = formData.get('nextResetDate') as string
    const prize = formData.get('prizeDescription') as string
    const periodStart = formData.get('periodStart') as string
    await updateContestSettings(nextReset, prize, periodStart)
    redirect('/admin/contest?saved=1')
  }

  async function handleMarkPaid(formData: FormData) {
    'use server'
    const winnerId = formData.get('winnerId') as string
    await markWinnerPaid(winnerId)
    redirect('/admin/contest')
  }

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-white">Contest</h1>

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl">
          Settings saved successfully.
        </div>
      )}

      {/* Unpaid winners queue */}
      {unpaidWinners.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest">
            Pending Payment ({unpaidWinners.length})
          </h2>
          {unpaidWinners.map(w => (
            <div key={w.id} className="glass rounded-xl px-5 py-4 flex items-center justify-between border border-amber-500/20">
              <div>
                <div className="text-white font-semibold">{w.users?.full_name}</div>
                <div className="text-white/40 text-xs mt-0.5">{w.users?.email} · {w.period_label} · {settings.prize_description}</div>
              </div>
              <form action={handleMarkPaid}>
                <input type="hidden" name="winnerId" value={w.id} />
                <SubmitButton
                  pendingLabel="Marking paid..."
                  className="flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-wait text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark Paid
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Current period leader */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Current Period Leader</h2>
        <div className="text-white/30 text-xs mb-1">
          {new Date(settings.period_start).toLocaleDateString()} → {settings.next_reset_date ? new Date(settings.next_reset_date).toLocaleDateString() : 'No end date set'}
        </div>
        {currentLeader ? (
          <div className="glass rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">{currentLeader.full_name}</div>
              <div className="text-white/40 text-xs mt-0.5">
                {currentLeader.submission_count} submissions · {currentLeader.total_views} views · {calculateGrade(currentLeader.graduating_year).label}
              </div>
            </div>
            <form action={handleChooseWinner}>
              <input type="hidden" name="userId" value={currentLeader.id} />
              <input type="hidden" name="periodLabel" value={periodLabel} />
              <input type="hidden" name="periodStart" value={settings.period_start} />
              <input type="hidden" name="periodEnd" value={settings.next_reset_date ?? ''} />
              <SubmitButton
                pendingLabel="Choosing winner..."
                className="text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-70 disabled:cursor-wait text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Choose as Winner
              </SubmitButton>
            </form>
          </div>
        ) : (
          <div className="glass rounded-xl px-5 py-6 text-center text-white/25 text-sm">
            No submissions this period yet.
          </div>
        )}

        {/* Top 5 */}
        {leaders.length > 1 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {leaders.slice(1, 5).map((e, i) => (
              <div key={e.id} className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="text-white/25 text-sm w-5">#{i + 2}</span>
                <div className="flex-1">
                  <span className="text-white/70 text-sm">{e.full_name}</span>
                  <span className="text-white/30 text-xs ml-2">{e.submission_count} submissions</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Settings</h2>
        <form action={handleUpdateSettings} className="glass rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Period Start</label>
            <input
              type="date"
              name="periodStart"
              defaultValue={settings.period_start}
              className="glass-input rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Next Reset Date</label>
            <input
              type="date"
              name="nextResetDate"
              defaultValue={settings.next_reset_date ?? ''}
              className="glass-input rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Prize Description</label>
            <input
              type="text"
              name="prizeDescription"
              defaultValue={settings.prize_description}
              className="glass-input rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>
          <SubmitButton
            pendingLabel="Saving..."
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-70 disabled:cursor-wait text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            Save Settings
          </SubmitButton>
        </form>
      </div>

      {/* Marketing assets */}
      <MarketingAssets />

      {/* Past winners */}
      {paidWinners.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Past Winners</h2>
          {paidWinners.map(w => (
            <div key={w.id} className="glass rounded-xl px-5 py-3 flex items-center justify-between opacity-60">
              <div>
                <span className="text-white text-sm font-medium">{w.users?.full_name}</span>
                <span className="text-white/40 text-xs ml-2">{w.period_label}</span>
              </div>
              <span className="text-emerald-400 text-xs">Paid ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
