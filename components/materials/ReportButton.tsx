'use client'
import { useState, useTransition } from 'react'
import { reportMaterial } from '@/app/actions/reports'

export default function ReportButton({
  schoolSlug,
  materialId,
  materialTitle,
}: {
  schoolSlug: string
  materialId: string
  materialTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pending, startTransition] = useTransition()

  function openModal(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(true)
    setReason('')
    setStatus('idle')
    setErrorMsg('')
  }

  function submit() {
    startTransition(async () => {
      const result = await reportMaterial(schoolSlug, materialId, reason)
      if (result.ok) {
        setStatus('done')
      } else {
        setStatus('error')
        setErrorMsg(result.error)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Report this material"
        title="Report this material"
        className="flex items-center gap-1 text-xs text-white/30 hover:text-rose-300 px-2 py-0.5 rounded-full border border-white/5 hover:border-rose-400/30 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5a2 2 0 012-2h12l-2 5 2 5H5" />
        </svg>
      </button>

      {open && (
        <div
          onClick={e => { e.stopPropagation(); setOpen(false) }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(6, 6, 15, 0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            {status === 'done' ? (
              <>
                <h2 className="text-white font-semibold text-lg mb-2">Report submitted</h2>
                <p className="text-white/60 text-sm mb-6">
                  Thanks — an admin will review it. If they agree it violates
                  the rules, the material will be removed.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h2 className="text-white font-semibold text-lg mb-1">Report material</h2>
                <p className="text-white/40 text-xs mb-4 truncate">&ldquo;{materialTitle}&rdquo;</p>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                  What&apos;s wrong?
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  placeholder="e.g. this is a real test, not study notes / copyright / wrong course / ..."
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm resize-y leading-relaxed"
                  autoFocus
                />
                {status === 'error' && (
                  <p className="text-rose-300 text-xs mt-2">{errorMsg}</p>
                )}
                <div className="flex gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-sm font-medium rounded-xl py-2.5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={pending || reason.trim().length < 3}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                  >
                    {pending ? 'Submitting...' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
