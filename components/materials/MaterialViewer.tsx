'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface Material {
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
}

export default function MaterialViewer({ material }: { material: Material }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (material.contentType === 'pdf' && material.pdfPath) {
      const supabase = createSupabaseBrowserClient()
      supabase.storage.from('materials').createSignedUrl(material.pdfPath, 3600)
        .then(({ data }) => { if (data) setPdfUrl(data.signedUrl) })
    }
  }, [material])

  if (material.contentType === 'richtext') {
    const json = material.contentJson as { text?: string } | null
    const text = json?.text ?? ''
    return (
      <pre className="p-5 text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-sans">
        {text}
      </pre>
    )
  }

  if (!pdfUrl) return <div className="p-5 text-white/40 text-sm">Loading PDF...</div>

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-[600px]"
      title="PDF Viewer"
    />
  )
}
