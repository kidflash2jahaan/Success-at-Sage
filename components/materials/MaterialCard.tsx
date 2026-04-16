'use client'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { incrementViewCount } from '@/app/actions/materials'
import MaterialViewer from './MaterialViewer'

interface Material {
  id: string
  title: string
  type: 'note' | 'test'
  contentJson: unknown
  linkUrl: string | null
  attachmentPath: string | null
  viewCount: number
  uploaderName: string
}

const RECENTS_KEY = 'sas_recent_materials'
const MAX_RECENTS = 10

interface RecentMaterial {
  id: string
  title: string
  type: 'note' | 'test'
  courseSlug: string
  unitId: string
}

function pushRecentMaterial(entry: RecentMaterial) {
  try {
    const stored: RecentMaterial[] = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
    const next = [entry, ...stored.filter(m => m.id !== entry.id)].slice(0, MAX_RECENTS)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('sas-recents-updated'))
  } catch {}
}

async function openAttachment(path: string) {
  const supabase = createSupabaseBrowserClient()
  const { data } = await supabase.storage.from('materials').createSignedUrl(path, 3600)
  if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export default function MaterialCard({
  material,
  accentColor,
  courseSlug,
  unitId,
}: {
  material: Material
  accentColor: string
  courseSlug: string
  unitId: string
}) {
  const [open, setOpen] = useState(false)
  const [viewCount, setViewCount] = useState(material.viewCount)

  async function handleOpen() {
    if (!open) {
      pushRecentMaterial({ id: material.id, title: material.title, type: material.type, courseSlug, unitId })
      await incrementViewCount(material.id)
      setViewCount(v => v + 1)
    }
    setOpen(o => !o)
  }

  return (
    <div className="glass rounded-xl overflow-hidden card-hover transition-all hover:border-white/[0.13]">
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.04] transition-colors"
      >
        <div>
          <div className="text-white/90 font-medium text-sm">{material.title}</div>
          <div className="text-white/30 text-xs mt-0.5">
            by {material.uploaderName} · {viewCount} view{viewCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {material.attachmentPath && (
            <button
              type="button"
              onClick={async e => { e.stopPropagation(); await openAttachment(material.attachmentPath!) }}
              className="flex items-center gap-1 text-xs text-emerald-400/70 hover:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-400/20 hover:border-emerald-400/40 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attachment
            </button>
          )}
          {material.linkUrl && (
            <a
              href={material.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-sky-400/70 hover:text-sky-400 px-2 py-0.5 rounded-full border border-sky-400/20 hover:border-sky-400/40 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Link
            </a>
          )}
          <svg
            className={`w-4 h-4 text-white/25 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`accordion-grid${open ? ' open' : ''}`}>
        <div>
          <div className="border-t border-white/[0.07]">
            <MaterialViewer material={material} />
          </div>
        </div>
      </div>
    </div>
  )
}
