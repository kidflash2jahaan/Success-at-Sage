'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface TopNavProps {
  schoolSlug: string
  userName: string
  isAdmin?: boolean
  onMenuClick?: () => void
  /** Short display name of the current tenant (e.g. "Sage"). Rendered as "Success at {displayShort}" in the logo. */
  displayShort: string
}

export default function TopNav({ schoolSlug, userName, isAdmin, onMenuClick, displayShort }: TopNavProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const slug = schoolSlug
  const brand = `Success at ${displayShort}`

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/s/${slug}/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header
      className="animate-fade-in-down glass-nav flex items-center px-4 gap-4 shrink-0 sticky top-0 z-10"
      style={{ height: '56px', paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Mobile: just the logo */}
      <Link href={`/s/${slug}/dashboard`} className="md:hidden font-bold text-white text-base tracking-tight">
        {brand}
      </Link>

      {/* Desktop: hamburger + logo + search */}
      <button
        onClick={onMenuClick}
        className="hidden text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link href={`/s/${slug}/dashboard`} className="font-bold text-white text-sm hidden md:block shrink-0 tracking-tight">
        {brand}
      </Link>

      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search materials..."
          className="glass-input w-full rounded-lg px-4 py-1.5 text-sm"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/s/${slug}/dashboard`}
          className="hidden sm:block text-sm text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href={`/s/${slug}/trending`}
          className="hidden sm:block text-sm text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Trending
        </Link>
        <Link
          href={`/s/${slug}/leaderboard`}
          className="hidden sm:block text-sm text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Leaderboard
        </Link>
        {isAdmin && (
          <Link
            href={`/s/${slug}/admin`}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Admin
          </Link>
        )}
        <Link
          href={`/s/${slug}/submit`}
          className="btn-press hidden sm:flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-500/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit
        </Link>
        <Link
          href={`/s/${slug}/profile`}
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
