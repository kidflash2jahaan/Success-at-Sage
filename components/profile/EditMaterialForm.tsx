'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { editMaterial } from '@/app/actions/materials'
import { uploadFileWithTUS, uploadPdfWithTUS } from '@/lib/storage/upload'
import { imagesToPdf, isPdfFile } from '@/lib/utils/imagesToPdf'
import { fileNameFromPath } from '@/lib/utils/attachments'
import FileDropZone from '@/components/ui/FileDropZone'
import PdfDropZone from '@/components/ui/PdfDropZone'
import Link from 'next/link'

interface Props {
  id: string
  unitId: string
  initialTitle: string
  initialContentType: 'richtext' | 'pdf'
  initialContent: string
  initialAttachmentPaths: string[]
  initialPdfPath: string | null
  unitTitle: string
  courseName: string
}

export default function EditMaterialForm({
  id, unitId, initialTitle, initialContentType,
  initialContent, initialAttachmentPaths, initialPdfPath,
  unitTitle, courseName,
}: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'typed' | 'paper'>(initialContentType === 'pdf' ? 'paper' : 'typed')
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [existingPaths, setExistingPaths] = useState<string[]>(initialAttachmentPaths)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [keepExistingPdf] = useState(!!initialPdfPath)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    if (mode === 'paper' && pdfFiles.length === 0 && !keepExistingPdf) return
    setSaving(true)
    setError('')
    try {
      let result
      if (mode === 'paper') {
        let pdfPath = initialPdfPath
        if (pdfFiles.length > 0) {
          const fileToUpload = pdfFiles.length === 1 && isPdfFile(pdfFiles[0])
            ? pdfFiles[0]
            : await imagesToPdf(pdfFiles)
          pdfPath = await uploadPdfWithTUS(fileToUpload, unitId)
        }
        result = await editMaterial(id, title, 'note', 'pdf', null, pdfPath, undefined, null)
      } else {
        const uploadedPaths: string[] = []
        for (const file of newFiles) {
          const path = await uploadFileWithTUS(file, unitId)
          uploadedPaths.push(path)
        }
        const finalPaths = [...existingPaths, ...uploadedPaths]
        result = await editMaterial(id, title, 'note', 'richtext', content, null, undefined, finalPaths.length ? finalPaths : null)
      }
      if (!result.ok) {
        setError(result.error)
        setSaving(false)
        return
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
        {(['paper', 'typed'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}>
            {m === 'typed' ? 'Typed' : 'Paper (PDF)'}
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

        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">PDF File</label>
          <PdfDropZone
            files={pdfFiles}
            onChange={setPdfFiles}
            existingFileName={initialPdfPath ? fileNameFromPath(initialPdfPath) : undefined}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !title.trim() || (mode === 'paper' && pdfFiles.length === 0 && !initialPdfPath)}
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
