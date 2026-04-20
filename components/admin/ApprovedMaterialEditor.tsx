'use client'
import { useState, useTransition } from 'react'
import { adminEditMaterial, deleteMaterial } from '@/app/actions/admin'
import { uploadFileWithTUS } from '@/lib/storage/upload'
import { fileNameFromPath, openAttachment } from '@/lib/utils/attachments'
import MaterialViewer from '@/components/materials/MaterialViewer'
import FileDropZone from '@/components/ui/FileDropZone'
import UnitSelectorWithCreate from './UnitSelectorWithCreate'

interface Item {
  id: string
  title: string
  type: string
  contentType: 'richtext' | 'pdf'
  contentJson: unknown
  pdfPath: string | null
  linkUrl: string | null
  attachmentPaths: string[]
}

interface AvailableUnit {
  id: string
  title: string
  courseName: string
}

interface Course {
  id: string
  name: string
}

export default function ApprovedMaterialEditor({ item, availableUnits = [], courses = [] }: { item: Item; availableUnits?: AvailableUnit[]; courses?: Course[] }) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
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
          <div className="flex gap-2 mt-1">
            {item.contentType === 'pdf' && <span className="text-xs px-2 py-0.5 bg-rose-500/10 rounded-full text-rose-400/70">PDF</span>}
            {item.contentType !== 'pdf' && item.attachmentPaths.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 rounded-full text-emerald-400/70">
                {item.attachmentPaths.length === 1 ? 'Attachment' : `${item.attachmentPaths.length} Attachments`}
              </span>
            )}
            {item.linkUrl && <span className="text-xs px-2 py-0.5 bg-sky-500/10 rounded-full text-sky-400/70">Link</span>}
          </div>
        </div>
        <button type="button" onClick={() => setExpanded(e => !e)} className="text-violet-400 hover:text-violet-300 text-sm transition-colors shrink-0">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.07]">
          <MaterialViewer material={{ contentType: item.contentType, contentJson: item.contentJson, pdfPath: item.pdfPath }} />
          {item.attachmentPaths.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.07] flex flex-col gap-2">
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {[...item.attachmentPaths]
                  .sort((a, b) => fileNameFromPath(a).localeCompare(fileNameFromPath(b)))
                  .map(path => (
                    <button key={path} type="button" onClick={() => openAttachment(path)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/80 hover:text-emerald-400 border border-emerald-500/15 transition-colors">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {fileNameFromPath(path)}
                    </button>
                  ))}
              </div>
            </div>
          )}
          {item.linkUrl && (
            <div className="px-5 py-3 border-t border-white/[0.07]">
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-1.5">Link</p>
              <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-sky-400/70 hover:text-sky-400 underline underline-offset-2 transition-colors break-all">
                {item.linkUrl}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-3 border-t border-white/[0.07] flex flex-col gap-3">
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
              <UnitSelectorWithCreate
                materialId={item.id}
                availableUnits={availableUnits}
                courses={courses}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(async () => {
                  const newPaths: string[] = []
                  for (const file of editAttachmentFiles) {
                    const path = await uploadFileWithTUS(file, item.id)
                    newPaths.push(path)
                  }
                  const allPaths = newPaths.length ? [...item.attachmentPaths, ...newPaths] : undefined
                  await adminEditMaterial(item.id, editTitle, 'note', editContent, editLinkUrl, allPaths)
                  setMode('view')
                  setEditAttachmentFiles([])
                })}
                className="flex-1 bg-violet-600/80 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {pending ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setMode('view')}
                className="flex-1 glass hover:bg-white/[0.08] text-white/60 text-sm py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}

        {mode === 'delete' && (
          <div className="flex gap-2">
            <form action={deleteMaterial.bind(null, item.id)} className="flex-1">
              <button type="submit" className="w-full bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                Confirm Delete
              </button>
            </form>
            <button type="button" onClick={() => setMode('view')}
              className="flex-1 glass hover:bg-white/[0.08] text-white/60 text-sm py-2 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        )}

        {mode === 'view' && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('edit')}
              className="flex-1 glass hover:bg-white/[0.08] text-white/50 text-sm font-medium py-2 rounded-lg border border-white/[0.08] transition-colors">
              Edit
            </button>
            <button type="button" onClick={() => setMode('delete')}
              className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 rounded-lg border border-red-600/30 transition-colors">
              ✕ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
