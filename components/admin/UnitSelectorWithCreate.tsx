'use client'
import { useState, useTransition } from 'react'
import { adminMoveMaterialToUnit, adminCreateUnitAndMove } from '@/app/actions/admin'

interface AvailableUnit { id: string; title: string; courseName: string }
interface Course { id: string; name: string }

export default function UnitSelectorWithCreate({
  materialId,
  availableUnits,
  courses,
}: {
  materialId: string
  availableUnits: AvailableUnit[]
  courses: Course[]
}) {
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [creating, setCreating] = useState(false)
  const [newCourseId, setNewCourseId] = useState('')
  const [newUnitTitle, setNewUnitTitle] = useState('')
  const [movePending, startMoveTransition] = useTransition()
  const [createPending, startCreateTransition] = useTransition()

  const groupedUnits = availableUnits.reduce<Record<string, AvailableUnit[]>>((acc, u) => {
    ;(acc[u.courseName] ??= []).push(u)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.07]">
      {!creating ? (
        <div className="flex gap-2">
          <select
            value={selectedUnitId}
            onChange={e => setSelectedUnitId(e.target.value)}
            className="glass-input flex-1 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Move to unit…</option>
            {Object.entries(groupedUnits).map(([course, units]) => (
              <optgroup key={course} label={course}>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedUnitId || movePending}
            onClick={() => startMoveTransition(async () => {
              await adminMoveMaterialToUnit(materialId, selectedUnitId)
              setSelectedUnitId('')
            })}
            className="shrink-0 px-3 py-2 rounded-lg bg-violet-600/40 hover:bg-violet-600/70 disabled:opacity-30 text-white/80 text-sm transition-colors"
          >
            {movePending ? 'Moving…' : 'Move'}
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/50 text-sm transition-colors"
            title="Create new unit"
          >
            + New
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/30 px-1">Create a new unit and move this material into it</p>
          <select
            value={newCourseId}
            onChange={e => setNewCourseId(e.target.value)}
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select course…</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            value={newUnitTitle}
            onChange={e => setNewUnitTitle(e.target.value)}
            placeholder="New unit title"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!newCourseId || !newUnitTitle.trim() || createPending}
              onClick={() => startCreateTransition(async () => {
                await adminCreateUnitAndMove(materialId, newCourseId, newUnitTitle)
                setCreating(false)
                setNewCourseId('')
                setNewUnitTitle('')
              })}
              className="flex-1 bg-violet-600/80 hover:bg-violet-600 disabled:opacity-30 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {createPending ? 'Creating…' : 'Create & Move'}
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setNewCourseId(''); setNewUnitTitle('') }}
              className="flex-1 glass hover:bg-white/[0.08] text-white/60 text-sm py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
