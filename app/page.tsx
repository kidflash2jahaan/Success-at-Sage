export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const user = await getCurrentUser().catch(() => null)
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="glass-nav sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4">
        <span className="font-bold text-white tracking-tight text-base shrink-0">
          Success at Sage
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/leaderboard"
            className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Leaderboard
          </Link>
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

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative">
        <div className="max-w-2xl w-full">
          {/* Badge */}
          <div className="animate-fade-in-down inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-violet-300 glass px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
            For Sage Hill School Students
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up stagger-2 text-5xl sm:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
            Study smarter.<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Ace every test.
            </span>
          </h1>

          {/* Subtext */}
          <p className="animate-fade-up stagger-3 text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
            Student-submitted study notes and practice tests, organized by course and unit.
            Made by Sage Hill students, for Sage Hill students.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up stagger-4 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="btn-press btn-glow font-semibold text-white bg-violet-600 hover:bg-violet-500 px-7 py-3 rounded-xl text-base transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.35)]"
            >
              Create Free Account
            </Link>
            <Link
              href="/leaderboard"
              className="btn-press font-semibold text-white/80 hover:text-white glass px-7 py-3 rounded-xl text-base transition-all hover:bg-white/[0.08]"
            >
              Leaderboard
            </Link>
          </div>

          {/* Subtle divider stat pills */}
          <div className="animate-fade-up stagger-6 flex items-center justify-center gap-6 mt-14 flex-wrap">
            {[
              { label: 'Courses', value: '127+' },
              { label: 'Departments', value: '8' },
              { label: 'Free forever', value: '✓' },
            ].map(stat => (
              <div key={stat.label} className="glass px-5 py-2.5 rounded-xl flex items-center gap-3">
                <span className="text-lg font-bold text-violet-300">{stat.value}</span>
                <span className="text-sm text-white/40">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 text-center text-white/20 text-xs">
        Success at Sage — A passion project for Sage Hill School
      </footer>
    </div>
  )
}
