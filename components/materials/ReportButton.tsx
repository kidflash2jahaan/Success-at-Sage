'use client'
import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { reportMaterial } from '@/app/actions/reports'

type Status = { kind: 'idle' } | { kind: 'done' } | { kind: 'error'; msg: string }

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
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [pending, startTransition] = useTransition()
  // Track when the component is mounted on the client so the portal target
  // (document.body) is available. Without this guard, createPortal would
  // run on the server during SSR and crash.
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  function openModal(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(true)
    setReason('')
    setStatus({ kind: 'idle' })
  }

  function submit() {
    startTransition(async () => {
      const result = await reportMaterial(schoolSlug, materialId, reason)
      setStatus(result.ok ? { kind: 'done' } : { kind: 'error', msg: result.error })
    })
  }

  // Modal markup. Rendered into a portal at document.body so that
  // ancestor transforms (e.g. MaterialCard's hover translateY which Motion
  // applies via transform) don't redefine "fixed to viewport" for this
  // overlay. CSS spec: any ancestor with transform / filter / perspective
  // creates a containing block for fixed-positioned descendants — without
  // a portal, the modal anchors to the card, not the screen.
  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => { e.stopPropagation(); setOpen(false) }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(6, 6, 15, 0.7)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="glass rounded-2xl p-6 w-full max-w-md"
          >
            {status.kind === 'done' ? (
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
                {status.kind === 'error' && (
                  <p className="text-rose-300 text-xs mt-2">{status.msg}</p>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

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
      {mounted && createPortal(modal, document.body)}
    </>
  )
}
