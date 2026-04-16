'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface SidebarProps {
  courses?: unknown[]   // kept for compat, not used
  activeCourseSlug?: string
  onClose?: () => void
}

interface RecentMaterial {
  id: string
  title: string
  type: 'note' | 'test'
  courseSlug: string
  unitId: string
}

const RECENTS_KEY = 'sas_recent_materials'

export default function Sidebar({ activeCourseSlug, onClose }: SidebarProps) {
  const [recents, setRecents] = useState<RecentMaterial[]>([])

  useEffect(() => {
    function load() {
      try {
        const stored: RecentMaterial[] = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
        setRecents(Array.isArray(stored) ? stored : [])
      } catch {}
    }
    load()
    // Refresh when MaterialCard pushes a new recent (same tab) or other tabs change storage
    window.addEventListener('sas-recents-updated', load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener('sas-recents-updated', load)
      window.removeEventListener('storage', load)
    }
  }, [])

  // Also re-read on path change so sidebar refreshes after navigating to a unit and opening a file
  useEffect(() => {
    try {
      const stored: RecentMaterial[] = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
      setRecents(Array.isArray(stored) ? stored : [])
    } catch {}
  }, [activeCourseSlug])

  return (
    <nav className="glass-sidebar w-64 shrink-0 h-full flex flex-col overflow-y-auto">
      <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Recents</span>
        <Link
          href="/browse"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Browse & add courses"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      <div className="flex-1 py-2 px-2">
        {recents.length === 0 ? (
          <p className="px-3 py-3 text-xs text-white/20 leading-relaxed">
            Files you open will appear here.
          </p>
        ) : (
          recents.map(m => (
            <Link
              key={m.id}
              href={`/courses/${m.courseSlug}/units/${m.unitId}`}
              onClick={onClose}
              className="sidebar-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-white/50 hover:text-white hover:bg-white/[0.04]"
            >
              <span
                className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: m.type === 'note' ? 'rgba(124,58,237,0.2)' : 'rgba(251,191,36,0.15)',
                  color: m.type === 'note' ? '#a78bfa' : '#fbbf24',
                }}
              >
                {m.type === 'note' ? 'Note' : 'Test'}
              </span>
              <span className="truncate leading-snug">{m.title}</span>
            </Link>
          ))
        )}
      </div>
    </nav>
  )
}
