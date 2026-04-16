'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { editMaterial, getSignedAttachmentUploadUrl } from '@/app/actions/materials'
import FileDropZone from '@/components/ui/FileDropZone'
import Link from 'next/link'

interface Props {
  id: string
  unitId: string
  initialTitle: string
  initialContent: string
  initialLinkUrl: string
  hasAttachment: boolean
  unitTitle: string
  courseName: string
}

export default function EditMaterialForm({ id, unitId, initialTitle, initialContent, initialLinkUrl, hasAttachment, unitTitle, courseName }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [keepAttachment, setKeepAttachment] = useState(hasAttachment)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError('')
    try {
      let newAttachmentPath: string | null | undefined = undefined
      if (attachmentFile) {
        const { signedUrl, path } = await getSignedAttachmentUploadUrl(attachmentFile.name, unitId)
        const res = await fetch(signedUrl, { method: 'PUT', body: attachmentFile, headers: { 'Content-Type': attachmentFile.type || 'application/octet-stream' } })
        if (!res.ok) throw new Error('Attachment upload failed')
        newAttachmentPath = path
      } else if (!keepAttachment) {
        newAttachmentPath = null
      }
      await editMaterial(id, title, content, linkUrl, newAttachmentPath)
      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Edit Submission</h1>
        <p className="text-white/35 text-sm mt-1">{courseName} · {unitTitle}</p>
      </div>

      <p className="text-amber-400/70 text-xs glass rounded-xl px-4 py-3" style={{ background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.2)' }}>
        Saving will re-submit this for admin review before it goes live again.
      </p>

      {error && (
        <div className="text-red-400 text-sm glass rounded-xl px-4 py-3" style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Content <span className="text-white/25 normal-case">(optional)</span></label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={12}
          className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-y leading-relaxed"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Attachment <span className="text-white/25 normal-case">(optional)</span></label>
        {hasAttachment && keepAttachment && !attachmentFile && (
          <div className="flex items-center justify-between glass rounded-xl px-4 py-2.5">
            <span className="text-xs text-emerald-400/70">Existing attachment kept</span>
            <button type="button" onClick={() => setKeepAttachment(false)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">
              Remove
            </button>
          </div>
        )}
        {(!hasAttachment || !keepAttachment || attachmentFile) && (
          <FileDropZone file={attachmentFile} onChange={f => { setAttachmentFile(f); if (f) setKeepAttachment(false) }} />
        )}
        {hasAttachment && !keepAttachment && !attachmentFile && (
          <button type="button" onClick={() => setKeepAttachment(true)} className="text-xs text-white/30 hover:text-white/50 px-1 transition-colors text-left">
            ← Keep existing attachment
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Link <span className="text-white/25 normal-case">(optional)</span></label>
        <input
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          type="url"
          placeholder="https://..."
          className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
        />
        <p className="text-xs text-white/25 px-1">Attach a relevant URL — a video, article, or website.</p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="btn-press bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
        >
          {saving ? 'Saving...' : 'Save & Resubmit'}
        </button>
        <Link href="/profile" className="btn-press glass hover:bg-white/[0.07] text-white/50 hover:text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition-all">
          Cancel
        </Link>
      </div>
    </form>
  )
}
