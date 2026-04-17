'use client'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { incrementViewCount } from '@/app/actions/materials'
import MaterialViewer from './MaterialViewer'

interface Material {
  id: string
  title: string
  type: 'note' | 'test'
  contentType: 'richtext' | 'pdf'
  contentJson: unknown
  pdfPath: string | null
  linkUrl: string | null
  attachmentPaths: string[]
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

function fileNameFromPath(path: string) {
  const segment = path.split('/').pop() ?? path
  return segment.replace(/^\d+-/, '')
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
        <div className="min-w-0">
          <div className="text-white/90 font-medium text-sm">{material.title}</div>
          <div className="text-white/30 text-xs mt-0.5">
            by {material.uploaderName} · {viewCount} view{viewCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {material.contentType === 'pdf' && (
            <span className="flex items-center gap-1 text-xs text-rose-400/70 px-2 py-0.5 rounded-full border border-rose-400/20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </span>
          )}
          {material.contentType !== 'pdf' && [...material.attachmentPaths]
            .sort((a, b) => fileNameFromPath(a).localeCompare(fileNameFromPath(b)))
            .map((path) => (
              <button
                key={path}
                type="button"
                onClick={async e => { e.stopPropagation(); await openAttachment(path) }}
                className="flex items-center gap-1 text-xs text-emerald-400/70 hover:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-400/20 hover:border-emerald-400/40 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {fileNameFromPath(path)}
              </button>
            ))}
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
            <MaterialViewer material={{ contentType: material.contentType, contentJson: material.contentJson, pdfPath: material.pdfPath }} />
          </div>
        </div>
      </div>
    </div>
  )
}
