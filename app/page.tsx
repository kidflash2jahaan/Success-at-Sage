export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="font-bold text-white">Success at Sage</span>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/60 hover:text-white">Browse Courses</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white">Sign In</Link>
          <Link href="/signup" className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl">
          <div className="inline-block text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-full px-3 py-1 mb-6">
            For Sage Hill High School Students
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Study smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Ace every test.
            </span>
          </h1>
          <p className="text-xl text-white/50 mb-10">
            Student-submitted study notes and past tests, organized by course and unit. Made by Sage Hill students, for Sage Hill students.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">
              Create Free Account
            </Link>
            <Link href="/browse" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">
              Browse Courses
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-white/10 text-center text-white/20 text-sm">
        Success at Sage — A passion project for Sage Hill High School
      </footer>
    </div>
  )
}
