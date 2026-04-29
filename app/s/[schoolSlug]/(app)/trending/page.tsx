export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import MotionFadeUp from '@/components/motion/MotionFadeUp'
import { MotionStagger, MotionItem } from '@/components/motion/MotionStagger'
import AnimatedCounter from '@/components/motion/AnimatedCounter'

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
  const { data } = await supabaseAdmin
    .from('materials')
    .select('id, title, type, view_count, unit_id, units(id, title, courses(slug, name))')
    .eq('status', 'approved')
    .order('view_count', { ascending: false })
    .limit(50)

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
    <div className="max-w-2xl mx-auto px-4 py-10">
      <MotionFadeUp>
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Trending</h1>
          <p className="text-white/40 text-sm">Most-viewed materials of all time</p>
        </div>
      </MotionFadeUp>

      {materials.length === 0 ? (
        <MotionFadeUp delay={0.1}>
          <div className="glass rounded-2xl px-6 py-14 text-center text-white/25 text-sm">
            No materials yet.
          </div>
        </MotionFadeUp>
      ) : (
        <MotionStagger className="flex flex-col gap-2" staggerChildren={0.03} delayChildren={0.12}>
          {materials.map((m, i) => {
            const isTop3 = i < 3
            const barWidth = topViewCount > 0 ? Math.max(4, Math.round((m.viewCount / topViewCount) * 100)) : 4
            const rankColors = ['#fbbf24', '#94a3b8', '#b87333']

            return (
              <MotionItem key={m.id}>
                <Link
                  href={`/courses/${m.courseSlug}/units/${m.unitId}`}
                  className="glass rounded-xl px-5 py-4 flex items-center gap-4 transition-all hover:bg-white/[0.06] hover:translate-y-[-2px] group"
                >
                  <div className="w-7 shrink-0 text-center">
                    {isTop3 ? (
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: rankColors[i],
                          textShadow: `0 0 10px ${rankColors[i]}50`,
                          animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined,
                        }}
                      >
                        #{i + 1}
                      </span>
                    ) : (
                      <span className="text-xs text-white/20 font-medium">#{i + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm font-medium truncate group-hover:text-white transition-colors">
                      {m.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/30 text-xs truncate">{m.courseName}</span>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-white/20 text-xs truncate">{m.unitTitle}</span>
                    </div>
                    <div className="mt-1.5 h-0.5 rounded-full bg-white/[0.06] overflow-hidden w-full max-w-[120px]">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${barWidth}%`,
                          background: isTop3 ? rankColors[i] : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-bold ${isTop3 ? '' : 'text-white/40'}`}
                      style={isTop3 ? { color: rankColors[i] } : undefined}>
                      <AnimatedCounter value={m.viewCount} duration={1.0} />
                    </div>
                    <div className="text-white/20 text-xs">views</div>
                  </div>
                </Link>
              </MotionItem>
            )
          })}
        </MotionStagger>
      )}
    </div>
  )
}
