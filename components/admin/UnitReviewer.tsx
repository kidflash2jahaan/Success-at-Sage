'use client'
import { useState, useTransition } from 'react'
import { approveUnit, rejectUnit, adminUpdatePendingUnitTitle } from '@/app/actions/admin'

interface PendingUnit {
  id: string
  title: string
  courseName: string
  submittedByName: string
  pendingMaterialCount: number
}

export default function UnitReviewer({ unit }: { unit: PendingUnit }) {
  const [title, setTitle] = useState(unit.title)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function saveTitle() {
    if (!title.trim() || title.trim() === unit.title) return
    startTransition(async () => {
      await adminUpdatePendingUnitTitle(unit.id, title)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setSaved(false) }}
              onBlur={saveTitle}
              className="glass-input rounded-lg px-3 py-1.5 text-sm text-white font-medium w-full"
            />
            {saved && <span className="text-emerald-400 text-xs shrink-0">Saved</span>}
          </div>
          <div className="text-white/40 text-xs mt-0.5">
            {unit.courseName} · proposed by {unit.submittedByName}
          </div>
          {unit.pendingMaterialCount > 0 && (
            <div className="text-xs mt-1.5 text-amber-400/70">
              {unit.pendingMaterialCount} pending material{unit.pendingMaterialCount !== 1 ? 's' : ''} attached
            </div>
          )}
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full border border-amber-400/30 text-amber-400 shrink-0">New Unit</span>
      </div>

      <div className="px-5 py-3 border-t border-white/[0.07] flex gap-2">
        <form action={approveUnit.bind(null, unit.id)} className="flex-1">
          <button type="submit" className="w-full bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            ✓ Approve Unit
          </button>
        </form>
        <form action={rejectUnit.bind(null, unit.id)} className="flex-1">
          <button type="submit" className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 rounded-lg border border-red-600/30 transition-colors">
            ✕ Reject Unit
          </button>
        </form>
      </div>
    </div>
  )
}
