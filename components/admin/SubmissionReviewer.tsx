'use client'
import { useState } from 'react'
import { approveMaterial, rejectMaterial } from '@/app/actions/admin'
import MaterialViewer from '@/components/materials/MaterialViewer'

interface SubmissionItem {
  id: string
  title: string
  type: string
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
  uploaderName: string
  uploaderEmail: string
  unitTitle: string
  courseName: string
}

export default function SubmissionReviewer({ item }: { item: SubmissionItem }) {
  const [expanded, setExpanded] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-white font-medium">{item.title}</div>
          <div className="text-white/40 text-xs mt-0.5">
            {item.courseName} · {item.unitTitle} · by {item.uploaderName}
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60 capitalize">{item.type}</span>
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">{item.contentType === 'pdf' ? 'PDF' : 'Text'}</span>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-purple-400 hover:text-purple-300 text-sm shrink-0">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/10">
          <MaterialViewer material={{ contentType: item.contentType, contentJson: item.contentJson, pdfPath: item.pdfPath }} />
        </div>
      )}

      <div className="px-5 py-3 border-t border-white/10 flex flex-col gap-3">
        {rejecting ? (
          <>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Rejection reason (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 resize-none" rows={2} />
            <div className="flex gap-2">
              <form action={rejectMaterial.bind(null, item.id, note)} className="flex-1">
                <button type="submit" className="w-full bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  Confirm Reject
                </button>
              </form>
              <button onClick={() => setRejecting(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-sm py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <form action={approveMaterial.bind(null, item.id)} className="flex-1">
              <button type="submit" className="w-full bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                ✓ Approve
              </button>
            </form>
            <button onClick={() => setRejecting(true)} className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 rounded-lg border border-red-600/30 transition-colors">
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
