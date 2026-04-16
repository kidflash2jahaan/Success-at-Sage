'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface Material {
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
}

function renderJson(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { type?: string; text?: string; content?: unknown[]; attrs?: Record<string, unknown> }

  if (n.type === 'text') return n.text ?? ''

  const children = (n.content ?? []).map(renderJson).join('')

  switch (n.type) {
    case 'doc': return children
    case 'paragraph': return `<p>${children}</p>`
    case 'heading': return `<h${n.attrs?.level ?? 1}>${children}</h${n.attrs?.level ?? 1}>`
    case 'bulletList': return `<ul>${children}</ul>`
    case 'orderedList': return `<ol>${children}</ol>`
    case 'listItem': return `<li>${children}</li>`
    case 'bold': return `<strong>${children}</strong>`
    case 'italic': return `<em>${children}</em>`
    case 'hardBreak': return '<br>'
    default: return children
  }
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
    const html = renderJson(material.contentJson)
    return (
      <div
        className="prose prose-invert max-w-none p-5 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
