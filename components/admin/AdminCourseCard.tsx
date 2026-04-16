'use client'
import { useState, useTransition } from 'react'
import { moveUnit, updateUnitTitle, deleteUnit, createUnit } from '@/app/actions/admin'

interface Unit { id: string; title: string; orderIndex: number }
interface Props { courseId: string; courseName: string; units: Unit[] }

export default function AdminCourseCard({ courseId, courseName, units: initialUnits }: Props) {
  const [units, setUnits] = useState(initialUnits)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [pending, startTransition] = useTransition()

  function startEdit(unit: Unit) {
    setEditingId(unit.id)
    setEditTitle(unit.title)
  }

  function handleMove(unitId: string, direction: 'up' | 'down') {
    // Optimistic reorder
    setUnits(prev => {
      const next = [...prev]
      const idx = next.findIndex(u => u.id === unitId)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
    startTransition(() => moveUnit(unitId, direction))
  }

  function handleSaveTitle(unitId: string) {
    if (!editTitle.trim()) return
    setUnits(prev => prev.map(u => u.id === unitId ? { ...u, title: editTitle.trim() } : u))
    setEditingId(null)
    startTransition(() => updateUnitTitle(unitId, editTitle))
  }

  function handleDelete(unitId: string) {
    setUnits(prev => prev.filter(u => u.id !== unitId))
    startTransition(() => deleteUnit(unitId))
  }

  function handleAdd() {
    if (!newTitle.trim()) return
    const t = newTitle.trim()
    setNewTitle('')
    startTransition(() => createUnit(courseId, t, units.length + 1))
  }

  return (
    <div className="mb-4 glass rounded-xl p-4">
      <div className="text-white font-medium mb-3">{courseName}</div>

      <div className="flex flex-col gap-1 mb-3">
        {units.map((unit, idx) => (
          <div key={unit.id} className="flex items-center gap-1 bg-white/[0.04] rounded-lg px-2 py-1.5 group">
            {/* Reorder arrows */}
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                disabled={idx === 0 || pending}
                onClick={() => handleMove(unit.id, 'up')}
                className="text-white/20 hover:text-white/60 disabled:opacity-0 disabled:pointer-events-none leading-none p-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                disabled={idx === units.length - 1 || pending}
                onClick={() => handleMove(unit.id, 'down')}
                className="text-white/20 hover:text-white/60 disabled:opacity-0 disabled:pointer-events-none leading-none p-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Title / inline edit */}
            {editingId === unit.id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(unit.id); if (e.key === 'Escape') setEditingId(null) }}
                className="flex-1 bg-transparent border-b border-violet-500/60 text-white text-sm focus:outline-none py-0.5 px-1"
              />
            ) : (
              <span className="flex-1 text-white/70 text-sm px-1">{unit.title}</span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {editingId === unit.id ? (
                <>
                  <button type="button" onClick={() => handleSaveTitle(unit.id)}
                    className="text-xs text-green-400 hover:text-green-300 px-1.5 transition-colors">Save</button>
                  <button type="button" onClick={() => setEditingId(null)}
                    className="text-xs text-white/30 hover:text-white/60 px-1 transition-colors">✕</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(unit)}
                    className="text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all p-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => handleDelete(unit.id)}
                    className="text-red-400/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs px-1">
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {units.length === 0 && (
          <p className="text-white/20 text-xs px-2 py-1">No units yet.</p>
        )}
      </div>

      {/* Add unit */}
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="New unit title..."
          className="glass-input flex-1 rounded-lg px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim() || pending}
          className="text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
