'use client'
import { useState } from 'react'
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

export default function MaterialCard({ material, accentColor }: { material: Material; accentColor: string }) {
  const [open, setOpen] = useState(false)
  const [viewCount, setViewCount] = useState(material.viewCount)

  async function handleOpen() {
    if (!open) {
      setOpen(true)
      await incrementViewCount(material.id)
      setViewCount(v => v + 1)
    } else {
      setOpen(false)
    }
  }

  return (
    <div className="glass rounded-xl overflow-hidden transition-all hover:border-white/[0.13]">
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
            {material.contentType === 'pdf' ? 'PDF' : 'Text'}
          </span>
          <svg
            className={`w-4 h-4 text-white/25 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/[0.07]">
          <MaterialViewer material={material} />
        </div>
      )}
    </div>
  )
}
