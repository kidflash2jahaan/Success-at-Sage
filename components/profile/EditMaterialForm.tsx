'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { editMaterial } from '@/app/actions/materials'
import { uploadFileWithTUS, uploadPdfWithTUS } from '@/lib/storage/upload'
import FileDropZone from '@/components/ui/FileDropZone'
import Link from 'next/link'

interface Props {
  id: string
  unitId: string
  initialTitle: string
  initialType: 'note' | 'test'
  initialContentType: 'richtext' | 'pdf'
  initialContent: string
  initialLinkUrl: string
  initialAttachmentPaths: string[]
  initialPdfPath: string | null
  unitTitle: string
  courseName: string
}

function fileNameFromPath(path: string) {
  const segment = path.split('/').pop() ?? path
  return segment.replace(/^\d+-/, '')
}

export default function EditMaterialForm({
  id, unitId, initialTitle, initialType, initialContentType,
  initialContent, initialLinkUrl, initialAttachmentPaths, initialPdfPath,
  unitTitle, courseName,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'typed' | 'paper'>(initialContentType === 'pdf' ? 'paper' : 'typed')
  const [title, setTitle] = useState(initialTitle)
  const [type, setType] = useState<'note' | 'test'>(initialType)
  const [content, setContent] = useState(initialContent)
  const [linkUrl, setLinkUrl] = useState(initialLinkUrl)
  const [existingPaths, setExistingPaths] = useState<string[]>(initialAttachmentPaths)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [keepExistingPdf] = useState(!!initialPdfPath)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (mode === 'paper' && !pdfFile && !keepExistingPdf) return
    setSaving(true)
    setError('')
    try {
      if (mode === 'paper') {
        const pdfPath = pdfFile ? await uploadPdfWithTUS(pdfFile, unitId) : initialPdfPath
        await editMaterial(id, title, type, 'pdf', null, pdfPath, undefined, null)
      } else {
        const uploadedPaths: string[] = []
        for (const file of newFiles) {
          const path = await uploadFileWithTUS(file, unitId)
          uploadedPaths.push(path)
        }
        const finalPaths = [...existingPaths, ...uploadedPaths]
        await editMaterial(id, title, type, 'richtext', content, null, linkUrl, finalPaths.length ? finalPaths : null)
      }
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

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 glass rounded-xl">
        {(['typed', 'paper'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}>
            {m === 'typed' ? '✏️ Typed' : '📄 Paper (PDF)'}
          </button>
        ))}
      </div>

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
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Type</label>
        <div className="flex gap-2">
          {(['note', 'test'] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`btn-press flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                type === t ? 'bg-violet-600 border-violet-600 text-white' : 'glass text-white/60 hover:text-white'
              }`}>
              {t === 'note' ? 'Study Note' : 'Practice Test'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'typed' ? (
        <>
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
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Attachments <span className="text-white/25 normal-case">(optional)</span></label>
            {existingPaths.length > 0 && (
              <div className="flex flex-col gap-1">
                {existingPaths.map((path, i) => (
                  <div key={i} className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/[0.08]">
                    <svg className="w-4 h-4 text-emerald-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="flex-1 text-white/60 text-sm truncate">{fileNameFromPath(path)}</span>
                    <button type="button" onClick={() => setExistingPaths(prev => prev.filter((_, j) => j !== i))}
                      className="text-white/25 hover:text-red-400/70 transition-colors shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FileDropZone files={newFiles} onChange={setNewFiles} label="Add attachments" />
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
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">PDF File</label>
          {!pdfFile && initialPdfPath && (
            <div className="flex items-center gap-3 glass rounded-xl px-4 py-2.5 border border-white/[0.08]">
              <svg className="w-4 h-4 text-rose-400/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-white/60 text-sm truncate">{fileNameFromPath(initialPdfPath)}</span>
              <span className="text-white/25 text-xs">Current file kept</span>
            </div>
          )}
          <label className={`flex flex-col items-center justify-center gap-3 glass rounded-xl border-2 border-dashed transition-all cursor-pointer px-6 py-10 ${pdfFile ? 'border-rose-400/40 bg-rose-500/5' : 'border-white/10 hover:border-white/20'}`}>
            <input type="file" accept="application/pdf,.pdf" className="sr-only"
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
            {pdfFile ? (
              <>
                <svg className="w-8 h-8 text-rose-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="text-center">
                  <p className="text-white/80 text-sm font-medium">{pdfFile.name}</p>
                  <p className="text-white/30 text-xs mt-0.5">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="text-center">
                  <p className="text-white/50 text-sm">{initialPdfPath ? 'Click to replace PDF' : 'Click to select a PDF'}</p>
                  <p className="text-white/25 text-xs mt-0.5">Max 50 MB</p>
                </div>
              </>
            )}
          </label>
          {pdfFile && (
            <button type="button" onClick={() => setPdfFile(null)} className="self-start text-xs text-white/25 hover:text-red-400/70 transition-colors px-1">
              Remove
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !title.trim() || (mode === 'paper' && !pdfFile && !initialPdfPath)}
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
