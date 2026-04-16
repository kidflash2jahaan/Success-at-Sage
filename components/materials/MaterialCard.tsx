'use client'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { incrementViewCount } from '@/app/actions/materials'
import MaterialViewer from './MaterialViewer'

interface Material {
  id: string
  title: string
  type: 'note' | 'test'
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
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
  const isPdf = material.contentType === 'pdf'

  async function handleOpen() {
    pushRecentMaterial({ id: material.id, title: material.title, type: material.type, courseSlug, unitId })
    await incrementViewCount(material.id)
    setViewCount(v => v + 1)

    if (isPdf) {
      if (!material.pdfPath) return
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase.storage.from('materials').createSignedUrl(material.pdfPath, 3600)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
      return
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
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ color: accentColor, borderColor: `${accentColor}35` }}
          >
            {isPdf ? 'PDF' : 'Text'}
          </span>
          <svg
            className={`w-4 h-4 text-white/25 transition-transform duration-300 ${!isPdf && open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            {isPdf ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        </div>
      </button>

      {!isPdf && (
        <div className={`accordion-grid${open ? ' open' : ''}`}>
          <div>
            <div className="border-t border-white/[0.07]">
              <MaterialViewer material={material} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
