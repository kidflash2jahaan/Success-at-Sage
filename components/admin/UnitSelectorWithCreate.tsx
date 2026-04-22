'use client'
import { useState, useTransition, useMemo } from 'react'
import { adminMoveMaterialToUnit, adminCreateUnitAndMove } from '@/app/actions/admin'
import { PendingButton } from '@/components/ui/SubmitButton'

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
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [newUnitTitle, setNewUnitTitle] = useState('')
  const [movePending, startMoveTransition] = useTransition()
  const [createPending, startCreateTransition] = useTransition()

  const filteredCourses = useMemo(() =>
    courseSearch.trim()
      ? courses.filter(c => c.name.toLowerCase().includes(courseSearch.toLowerCase()))
      : courses,
    [courses, courseSearch]
  )

  const groupedUnits = availableUnits.reduce<Record<string, AvailableUnit[]>>((acc, u) => {
    ;(acc[u.courseName] ??= []).push(u)
    return acc
  }, {})

  function resetCreate() {
    setCreating(false)
    setCourseSearch('')
    setSelectedCourse(null)
    setNewUnitTitle('')
  }

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
          <PendingButton
            pending={movePending}
            pendingLabel="Moving…"
            disabled={!selectedUnitId || movePending}
            onClick={() => startMoveTransition(async () => {
              await adminMoveMaterialToUnit(materialId, selectedUnitId)
              setSelectedUnitId('')
            })}
            className="shrink-0 px-3 py-2 rounded-lg bg-violet-600/40 hover:bg-violet-600/70 disabled:opacity-30 disabled:cursor-wait text-white/80 text-sm transition-colors"
          >
            Move
          </PendingButton>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-white/50 text-sm transition-colors"
          >
            + New
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/30 px-1">Create a new unit and move this material into it</p>

          {!selectedCourse ? (
            <div className="flex flex-col gap-1">
              <input
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                placeholder="Search course…"
                autoFocus
                className="glass-input w-full rounded-lg px-3 py-2 text-sm"
              />
              {courseSearch.trim() && (
                <div className="flex flex-col max-h-40 overflow-y-auto rounded-lg border border-white/[0.08] bg-black/40">
                  {filteredCourses.length === 0 ? (
                    <p className="text-xs text-white/30 px-3 py-2">No courses found</p>
                  ) : filteredCourses.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedCourse(c); setCourseSearch('') }}
                      className="text-left text-sm text-white/70 hover:text-white hover:bg-white/[0.06] px-3 py-2 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <span className="text-sm text-white/70 flex-1 truncate">{selectedCourse.name}</span>
              <button type="button" onClick={() => setSelectedCourse(null)} className="text-white/30 hover:text-white/60 text-xs transition-colors">
                ✕
              </button>
            </div>
          )}

          <input
            value={newUnitTitle}
            onChange={e => setNewUnitTitle(e.target.value)}
            placeholder="New unit title"
            className="glass-input w-full rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <PendingButton
              pending={createPending}
              pendingLabel="Creating…"
              disabled={!selectedCourse || !newUnitTitle.trim() || createPending}
              onClick={() => startCreateTransition(async () => {
                await adminCreateUnitAndMove(materialId, selectedCourse!.id, newUnitTitle)
                resetCreate()
              })}
              className="flex-1 bg-violet-600/80 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-wait text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Create & Move
            </PendingButton>
            <button
              type="button"
              onClick={resetCreate}
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
