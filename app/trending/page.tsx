export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import BackToDashboard from '@/components/BackToDashboard'

interface TrendingMaterial {
  id: string
  title: string
  type: 'note' | 'test'
  viewCount: number
  unitId: string
  unitTitle: string
  courseSlug: string
  courseName: string
}

export default async function TrendingPage() {
  const [{ data }, user] = await Promise.all([
    supabaseAdmin
      .from('materials')
      .select('id, title, type, view_count, unit_id, units(id, title, courses(slug, name))')
      .eq('status', 'approved')
      .order('view_count', { ascending: false })
      .limit(50),
    getCurrentUser().catch(() => null),
  ])

  const materials: TrendingMaterial[] = (data ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    viewCount: m.view_count ?? 0,
    unitId: m.unit_id,
    unitTitle: m.units?.title ?? '',
    courseSlug: m.units?.courses?.slug ?? '',
    courseName: m.units?.courses?.name ?? '',
  }))

  const topViewCount = materials[0]?.viewCount ?? 1

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-white tracking-tight text-base">Success at Sage</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/browse" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Browse</Link>
              <Link href="/signup" className="btn-press text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {user && <BackToDashboard />}

        <div className="animate-fade-up mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Trending</h1>
          <p className="text-white/40 text-sm">Most-viewed materials of all time</p>
        </div>

        {materials.length === 0 ? (
          <div className="glass rounded-2xl px-6 py-14 text-center text-white/25 text-sm">
            No materials yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {materials.map((m, i) => {
              const isTop3 = i < 3
              const barWidth = topViewCount > 0 ? Math.max(4, Math.round((m.viewCount / topViewCount) * 100)) : 4
              const rankColors = ['#fbbf24', '#94a3b8', '#b87333']

              return (
                <Link
                  key={m.id}
                  href={`/courses/${m.courseSlug}/units/${m.unitId}`}
                  className="animate-fade-up glass rounded-xl px-5 py-4 flex items-center gap-4 transition-all hover:bg-white/[0.06] group"
                  style={{ animationDelay: `${0.04 + i * 0.03}s` }}
                >
                  {/* Rank */}
                  <div className="w-7 shrink-0 text-center">
                    {isTop3 ? (
                      <span className="text-sm font-bold" style={{ color: rankColors[i], textShadow: `0 0 10px ${rankColors[i]}50` }}>
                        #{i + 1}
                      </span>
                    ) : (
                      <span className="text-xs text-white/20 font-medium">#{i + 1}</span>
                    )}
                  </div>

                  {/* Type badge */}
                  <span
                    className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: m.type === 'note' ? 'rgba(124,58,237,0.2)' : 'rgba(251,191,36,0.15)',
                      color: m.type === 'note' ? '#a78bfa' : '#fbbf24',
                    }}
                  >
                    {m.type === 'note' ? 'Note' : 'Test'}
                  </span>

                  {/* Title + course info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">
                      {m.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/30 text-xs truncate">{m.courseName}</span>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-white/20 text-xs truncate">{m.unitTitle}</span>
                    </div>
                    {/* View bar */}
                    <div className="mt-1.5 h-0.5 rounded-full bg-white/[0.06] overflow-hidden w-full max-w-[120px]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          background: isTop3 ? rankColors[i] : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    </div>
                  </div>

                  {/* View count */}
                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-bold ${isTop3 ? '' : 'text-white/40'}`}
                      style={isTop3 ? { color: rankColors[i] } : undefined}>
                      {m.viewCount.toLocaleString()}
                    </div>
                    <div className="text-white/20 text-xs">views</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
