'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface TopNavProps {
  userName: string
  onMenuClick?: () => void
}

export default function TopNav({ userName, onMenuClick }: TopNavProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="animate-fade-in-down glass-nav h-14 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link href="/dashboard" className="font-bold text-white text-sm hidden md:block shrink-0 tracking-tight">
        Success at Sage
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search materials..."
          className="glass-input w-full rounded-lg px-4 py-1.5 text-sm"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/leaderboard"
          className="hidden sm:block text-sm text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Leaderboard
        </Link>
        <Link
          href="/submit"
          className="btn-press hidden sm:flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit
        </Link>
        <Link
          href="/profile"
          className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          {userName}
        </Link>
        <button
          onClick={handleSignOut}
          className="text-sm text-white/30 hover:text-white/70 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
