export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentUser, calculateGrade } from '@/lib/auth'
import Link from 'next/link'

interface LeaderEntry {
  id: string
  fullName: string
  graduatingYear: number
  submissionCount: number
  totalViews: number
}

const MEDAL = ['#fbbf24', '#94a3b8', '#b87333']

export default async function LeaderboardPage() {
  const [{ data }, user] = await Promise.all([
    supabaseAdmin.rpc('get_leaderboard'),
    getCurrentUser(),
  ])

  const entries: LeaderEntry[] = (data ?? []).map((r: any) => ({
    id: r.id,
    fullName: r.full_name,
    graduatingYear: r.graduating_year,
    submissionCount: Number(r.submission_count),
    totalViews: Number(r.total_views),
  }))

  const myRank = user ? entries.findIndex(e => e.id === user.id) + 1 : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="animate-fade-up mb-10 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Top Contributors</h1>
        <p className="text-white/40 text-sm">Ranked by approved submissions</p>
      </div>

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
          <Link href="/submit" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Submit something →</Link>
        </div>
      )}
      {!user && (
        <div className="animate-fade-up stagger-2 glass rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between">
          <span className="text-white/40 text-sm">Sign in to see your rank.</span>
          <Link href="/login" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Sign in →</Link>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-14 text-center text-white/25 text-sm">
          No submissions yet — be the first!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => {
            const rank = i + 1
            const isMe = user?.id === entry.id
            const isMedal = rank <= 3
            const medalColor = isMedal ? MEDAL[i] : null
            const { label } = calculateGrade(entry.graduatingYear)

            return (
              <div
                key={entry.id}
                className="animate-fade-up glass rounded-xl px-5 py-4 flex items-center gap-4 transition-all hover:bg-white/[0.06]"
                style={{
                  animationDelay: `${0.05 + i * 0.045}s`,
                  ...(isMe ? { borderColor: 'rgba(124,58,237,0.35)' } : {}),
                }}
              >
                <div className="w-8 shrink-0 text-center">
                  {medalColor ? (
                    <span className="text-base font-bold" style={{ color: medalColor, textShadow: `0 0 12px ${medalColor}60` }}>
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
                  </div>
                  <div className="text-white/30 text-xs mt-0.5">{label}</div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: medalColor ?? 'rgba(255,255,255,0.7)' }}>
                      {entry.submissionCount}
                    </div>
                    <div className="text-white/25 text-xs">submitted</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-white/50">{entry.totalViews}</div>
                    <div className="text-white/25 text-xs">views</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
