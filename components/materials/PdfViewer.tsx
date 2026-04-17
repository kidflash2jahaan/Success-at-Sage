'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function PdfViewer({ pdfPath }: { pdfPath: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.storage.from('materials').createSignedUrl(pdfPath, 3600).then(({ data, error }) => {
      if (error || !data) { setError(true); return }
      setUrl(data.signedUrl)
    })
  }, [pdfPath])

  if (error) return (
    <div className="px-5 py-6 text-white/30 text-sm italic">Could not load PDF.</div>
  )

  if (!url) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 border-2 border-white/20 border-t-violet-400 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="w-full" style={{ height: '70vh' }}>
      <iframe
        src={`${url}#toolbar=1&navpanes=0`}
        className="w-full h-full border-0"
        title="PDF viewer"
      />
    </div>
  )
}
