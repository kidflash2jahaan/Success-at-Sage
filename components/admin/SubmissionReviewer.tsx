'use client'
import { useState, useTransition } from 'react'
import { approveMaterial, rejectMaterial, adminEditMaterial } from '@/app/actions/admin'
import { getSignedAttachmentUploadUrl } from '@/app/actions/materials'
import MaterialViewer from '@/components/materials/MaterialViewer'
import FileDropZone from '@/components/ui/FileDropZone'

interface SubmissionItem {
  id: string
  title: string
  type: string
  contentJson: unknown
  linkUrl: string | null
  attachmentPaths: string[]
  uploaderName: string
  uploaderEmail: string
  unitTitle: string
  courseName: string
}

export default function SubmissionReviewer({ item }: { item: SubmissionItem }) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<'review' | 'reject' | 'edit'>('review')
  const [note, setNote] = useState('')
  const [editTitle, setEditTitle] = useState(item.title)
  const [editContent, setEditContent] = useState(
    (item.contentJson as { text?: string } | null)?.text ?? ''
  )
  const [editLinkUrl, setEditLinkUrl] = useState(item.linkUrl ?? '')
  const [editAttachmentFiles, setEditAttachmentFiles] = useState<File[]>([])
  const [pending, startTransition] = useTransition()

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-white font-medium">{item.title}</div>
          <div className="text-white/40 text-xs mt-0.5">
            {item.courseName} · {item.unitTitle} · by {item.uploaderName}
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60 capitalize">{item.type}</span>
            {item.attachmentPaths.length > 0 && <span className="text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400/70">{item.attachmentPaths.length === 1 ? 'Attachment' : `${item.attachmentPaths.length} Attachments`}</span>}
            {item.linkUrl && <span className="text-xs px-2 py-0.5 bg-sky-500/10 rounded-full text-sky-400/70">Link</span>}
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)} className="text-violet-400 hover:text-violet-300 text-sm shrink-0 transition-colors">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.07]">
          <MaterialViewer material={{ contentJson: item.contentJson }} />
        </div>
      )}

      <div className="px-5 py-3 border-t border-white/[0.07] flex flex-col gap-3">
        {mode === 'reject' && (
          <>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Rejection reason (optional)"
              className="glass-input w-full rounded-lg px-3 py-2 text-sm resize-none" rows={2} />
            <div className="flex gap-2">
              <form action={rejectMaterial.bind(null, item.id, note)} className="flex-1">
                <button type="submit" className="w-full bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  Confirm Reject
                </button>
              </form>
              <button type="button" onClick={() => setMode('review')} className="flex-1 glass hover:bg-white/[0.08] text-white/60 text-sm py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}

        {mode === 'edit' && (
          <>
            <div className="flex flex-col gap-2">
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                className="glass-input w-full rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Content (optional)"
                rows={6}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm resize-y"
              />
              <div className="flex flex-col gap-1">
                {item.attachmentPaths.length > 0 && (
                  <p className="text-xs text-emerald-400/60 px-1">{item.attachmentPaths.length} existing attachment{item.attachmentPaths.length !== 1 ? 's' : ''} kept — upload below to add more</p>
                )}
                <FileDropZone files={editAttachmentFiles} onChange={setEditAttachmentFiles} />
              </div>
              <input
                value={editLinkUrl}
                onChange={e => setEditLinkUrl(e.target.value)}
                placeholder="Link URL (optional)"
                className="glass-input w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  const newPaths: string[] = []
                  for (const file of editAttachmentFiles) {
                    const { signedUrl, path } = await getSignedAttachmentUploadUrl(file.name, item.id)
                    const res = await fetch(signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } })
                    if (!res.ok) throw new Error('Attachment upload failed')
                    newPaths.push(path)
                  }
                  const allPaths = newPaths.length ? [...item.attachmentPaths, ...newPaths] : undefined
                  await adminEditMaterial(item.id, editTitle, editContent, editLinkUrl, allPaths)
                  setMode('review')
                })}
                className="flex-1 bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {pending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}

        {mode === 'review' && (
          <div className="flex gap-2">
            <form action={approveMaterial.bind(null, item.id)} className="flex-1">
              <button type="submit" className="w-full bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                ✓ Approve
              </button>
            </form>
            <button type="button" onClick={() => setMode('edit')} className="flex-1 glass hover:bg-white/[0.08] text-white/50 text-sm font-medium py-2 rounded-lg border border-white/[0.08] transition-colors">
              Edit
            </button>
            <button type="button" onClick={() => setMode('reject')} className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 rounded-lg border border-red-600/30 transition-colors">
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
