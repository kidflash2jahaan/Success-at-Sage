export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { isSuperadmin } from '@/lib/superadmin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import MotionFadeUp from '@/components/motion/MotionFadeUp'
import { MotionStagger, MotionItem } from '@/components/motion/MotionStagger'
import MotionCard from '@/components/motion/MotionCard'

/**
 * Root landing — the generic parent brand.
 *
 * Routing:
 * - Superadmin          → /admin/schools  (the cross-tenant console)
 * - Authenticated user  → /s/<their-school-slug>/dashboard
 * - Orphaned auth user  → /  (falls through to the marketing page so
 *                             they can re-request)
 * - Anonymous           → renders the generic "Success at HS" page
 *
 * Per-tenant landings (Sage hero, Oakwood hero, …) live at
 * /s/[schoolSlug] and are also served when a tenant subdomain is used
 * (see proxy.ts).
 */
export default async function RootLanding() {
  const user = await getCurrentUser().catch(() => null)

  if (user) {
    if (await isSuperadmin()) redirect('/admin/schools')

    const { data: school } = await supabaseAdmin
      .from('schools')
      .select('slug')
      .eq('id', user.schoolId)
      .single<{ slug: string }>()
    if (school) redirect(`/s/${school.slug}/dashboard`)
    // users row points at a deleted school — fall through to marketing
  }

  const { data: schoolsData } = await supabaseAdmin
    .from('schools')
    .select('slug, display_short, name')
    .order('created_at', { ascending: true })
    .returns<{ slug: string; display_short: string; name: string }[]>()
  const schools = schoolsData ?? []

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        <span className="font-bold text-white tracking-tight text-base shrink-0">
          Success at HS
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-press text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative">
        <div className="max-w-2xl w-full">
          <MotionFadeUp delay={0} y={-8}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-300 glass px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block animate-pulse" />
              The study platform for high schools
            </div>
          </MotionFadeUp>

          <MotionFadeUp delay={0.12}>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
              Study smarter.<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-pan 6s ease-in-out infinite',
                }}
              >
                Ace every test.
              </span>
            </h1>
          </MotionFadeUp>

          <MotionFadeUp delay={0.22}>
            <p className="text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
              Student-submitted study notes and practice tests, organized by course and unit —
              built for each high school, by its own students.
            </p>
          </MotionFadeUp>

          <MotionFadeUp delay={0.32}>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/signup"
                className="btn-press btn-glow font-semibold text-white bg-violet-600 hover:bg-violet-500 px-7 py-3 rounded-xl text-base transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.35)]"
              >
                Create Free Account
              </Link>
              <Link
                href="/request-school"
                className="btn-press font-semibold text-white/80 hover:text-white glass px-7 py-3 rounded-xl text-base transition-all hover:bg-white/[0.08]"
              >
                Bring it to your school
              </Link>
            </div>
          </MotionFadeUp>

          {schools.length > 0 && (
            <MotionFadeUp delay={0.5}>
              <div className="mt-14">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Participating schools</p>
                <MotionStagger className="flex items-center justify-center gap-3 flex-wrap" delayChildren={0.6} staggerChildren={0.08}>
                  {schools.map(s => (
                    <MotionItem key={s.slug}>
                      <MotionCard
                        href={`/s/${s.slug}`}
                        className="glass px-5 py-2.5 rounded-xl flex items-center gap-3 hover:bg-white/[0.08] transition-colors group"
                      >
                        <span className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{s.display_short}</span>
                        <span className="text-xs text-white/30">Success at {s.display_short} →</span>
                      </MotionCard>
                    </MotionItem>
                  ))}
                </MotionStagger>
              </div>
            </MotionFadeUp>
          )}
        </div>
      </main>

      <footer className="px-6 py-5 text-center text-white/20 text-xs">
        Success at HS — the study platform that meets each school where it is
      </footer>
    </div>
  )
}
