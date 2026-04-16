'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface Props {
  pdfPath: string
  title: string
  onClose: () => void
}

export default function PDFModal({ pdfPath, title, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.storage.from('materials').createSignedUrl(pdfPath, 3600)
      .then(({ data }) => { if (data) setUrl(data.signedUrl) })
  }, [pdfPath])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(6,6,18,0.92)', backdropFilter: 'blur(6px)' }}
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal panel — stops propagation so clicking inside doesn't close */}
      <div
        className="relative flex flex-col w-full h-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] shrink-0"
          style={{ background: 'rgba(13,15,36,0.95)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              PDF
            </span>
            <span className="text-white/80 text-sm font-medium truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in new tab
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF content */}
        <div className="flex-1 overflow-hidden">
          {!url ? (
            <div className="flex items-center justify-center h-full text-white/30 text-sm">
              Loading PDF...
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  )
}
