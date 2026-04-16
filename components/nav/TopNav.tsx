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
    <header className="h-14 border-b border-white/10 bg-[#1a1a2e] flex items-center px-4 gap-4 shrink-0">
      <button onClick={onMenuClick} className="md:hidden text-white/60 hover:text-white p-1">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <Link href="/dashboard" className="font-bold text-white text-sm hidden md:block shrink-0">
        Success at Sage
      </Link>
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search courses and materials..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
        />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <Link href="/submit" className="hidden sm:block text-sm text-purple-400 hover:text-purple-300 font-medium">
          + Submit
        </Link>
        <Link href="/profile" className="text-sm text-white/60 hover:text-white">
          {userName}
        </Link>
        <button onClick={handleSignOut} className="text-sm text-white/40 hover:text-white/70">
          Sign out
        </button>
      </div>
    </header>
  )
}
