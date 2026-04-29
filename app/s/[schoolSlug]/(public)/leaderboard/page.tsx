export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import { getCurrentUser, calculateGrade } from '@/lib/auth'
import Link from 'next/link'
import MotionFadeUp from '@/components/motion/MotionFadeUp'
import { MotionStagger, MotionItem } from '@/components/motion/MotionStagger'
import AnimatedCounter from '@/components/motion/AnimatedCounter'

interface LeaderEntry {
  id: string
  fullName: string
  graduatingYear: number
  submissionCount: number
  totalViews: number
}

const MEDAL = ['#fbbf24', '#94a3b8', '#b87333']

type ContestSettingsRow = {
  period_start: string
  next_reset_date: string | null
  prize_description: string
}

type LeaderboardRpcRow = {
  id: string
  full_name: string
  graduating_year: number
  submission_count: number | string
  total_views: number | string
}

export default async function LeaderboardPage({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  const [{ data: settings }, user] = await Promise.all([
    supabaseAdmin
      .from('contest_settings')
      .select('period_start, next_reset_date, prize_description')
      .eq('school_id', tenant.id)
      .single<ContestSettingsRow>(),
    getCurrentUser(),
  ])

  const today = new Date().toISOString().split('T')[0]
  const periodStart = settings?.period_start ?? today
  const nextReset = settings?.next_reset_date ?? null
  const prize = settings?.prize_description ?? '$50 Amazon gift card'

  const { data } = await supabaseAdmin.rpc('get_leaderboard_period', {
    p_start: periodStart,
    p_end: nextReset ?? today,
  })

  const rows = (data ?? []) as LeaderboardRpcRow[]
  const entries: LeaderEntry[] = rows.map(r => ({
    id: r.id,
    fullName: r.full_name,
    graduatingYear: r.graduating_year,
    submissionCount: Number(r.submission_count),
    totalViews: Number(r.total_views),
  }))

  const myRank = user ? entries.findIndex(e => e.id === user.id) + 1 : 0

  const resetDate = nextReset
    ? new Date(nextReset + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {tenant.prizeEnabled && (
        <MotionFadeUp delay={0}>
          <div className="mb-8 glass rounded-2xl px-6 py-5 text-center border border-amber-500/20 animate-float-bob">
            <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Prize</div>
            <div className="text-2xl font-bold text-white mb-1">{prize}</div>
            {resetDate && (
              <div className="text-white/40 text-sm">
                Winner chosen on <span className="text-white/70 font-medium">{resetDate}</span>
              </div>
            )}
          </div>
        </MotionFadeUp>
      )}

      <MotionFadeUp delay={0.08}>
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Top Contributors</h1>
          <p className="text-white/40 text-sm">
            Ranked by approved submissions this period
          </p>
        </div>
      </MotionFadeUp>

      {user && myRank > 0 && (
        <div className="animate-fade-up stagger-2 glass rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between">
          <span className="text-white/50 text-sm">Your rank</span>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">#{myRank}</span>
            <span className="text-white/30 text-xs">
              {entries[myRank - 1]?.submissionCount} submission{entries[myRank - 1]?.submissionCount !== 1 ? 's' : ''} · {entries[myRank - 1]?.totalViews} views
            </span>
          </div>
        </div>
      )}
      {user && myRank === 0 && (
        <div className="animate-fade-up stagger-2 glass rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between">
          <span className="text-white/40 text-sm">You haven&apos;t submitted anything approved yet.</span>
          <Link href={`/s/${schoolSlug}/submit`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Submit something →</Link>
        </div>
      )}
      {!user && (
        <div className="animate-fade-up stagger-2 glass rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between">
          <span className="text-white/40 text-sm">Sign in to see your rank.</span>
          <Link href="/login" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Sign in →</Link>
        </div>
      )}

      {entries.length === 0 ? (
        <MotionFadeUp delay={0.2}>
          <div className="glass rounded-2xl px-6 py-14 text-center text-white/25 text-sm">
            No submissions yet this period — be the first!
          </div>
        </MotionFadeUp>
      ) : (
        <MotionStagger className="flex flex-col gap-2" staggerChildren={0.045} delayChildren={0.2}>
          {entries.map((entry, i) => {
            const rank = i + 1
            const isMe = user?.id === entry.id
            const isMedal = rank <= 3
            const medalColor = isMedal ? MEDAL[i] : null
            const { label } = calculateGrade(entry.graduatingYear)

            return (
              <MotionItem
                key={entry.id}
                className="glass rounded-xl px-5 py-4 flex items-center gap-4 transition-all hover:bg-white/[0.06] hover:translate-y-[-1px]"
                style={isMe ? { borderColor: 'rgba(124,58,237,0.35)' } : undefined}
              >
                <div className="w-8 shrink-0 text-center">
                  {medalColor ? (
                    <span
                      className="text-base font-bold inline-block"
                      style={{
                        color: medalColor,
                        textShadow: `0 0 12px ${medalColor}60`,
                        animation: rank === 1 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined,
                      }}
                    >
                      #{rank}
                    </span>
                  ) : (
                    <span className="text-sm text-white/25 font-medium">#{rank}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm truncate ${isMe ? 'text-violet-300' : 'text-white/90'}`}>
                      {entry.fullName}
                    </span>
                    {isMe && <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400/70">you</span>}
                    {rank === 1 && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">leading</span>}
                  </div>
                  <div className="text-white/30 text-xs mt-0.5">{label}</div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: medalColor ?? 'rgba(255,255,255,0.7)' }}>
                      <AnimatedCounter value={entry.submissionCount} duration={0.9} />
                    </div>
                    <div className="text-white/25 text-xs">submitted</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-white/50">
                      <AnimatedCounter value={entry.totalViews} duration={1.1} />
                    </div>
                    <div className="text-white/25 text-xs">views</div>
                  </div>
                </div>
              </MotionItem>
            )
          })}
        </MotionStagger>
      )}
    </div>
  )
}
