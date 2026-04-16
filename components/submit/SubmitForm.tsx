'use client'
import { useState, useRef, useEffect } from 'react'
import { submitMaterial, getSignedUploadUrl, submitNewUnit } from '@/app/actions/materials'
import { useRouter } from 'next/navigation'

interface Course { id: string; name: string; slug: string }
interface Unit { id: string; title: string; courseId: string }

export default function SubmitForm({ courses, units, preselectedSlug, preselectedUnitId }: { courses: Course[]; units: Unit[]; preselectedSlug?: string; preselectedUnitId?: string }) {
  const router = useRouter()

  const initialCourse = preselectedSlug ? (courses.find(c => c.slug === preselectedSlug) ?? null) : null

  // Course search state
  const [courseQuery, setCourseQuery] = useState(initialCourse?.name ?? '')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse)
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false)
  const courseInputRef = useRef<HTMLInputElement>(null)
  const courseDropdownRef = useRef<HTMLDivElement>(null)

  // Unit state
  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnitId ?? '')
  const [creatingUnit, setCreatingUnit] = useState(false)
  const [newUnitTitle, setNewUnitTitle] = useState('')

  // Material state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'note' | 'test'>('note')
  const [contentType, setContentType] = useState<'pdf' | 'richtext'>('richtext')
  const [contentText, setContentText] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(courseQuery.toLowerCase())
  )
  const filteredUnits = units.filter(u => u.courseId === selectedCourse?.id)

  // Close course dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(e.target as Node) &&
        courseInputRef.current &&
        !courseInputRef.current.contains(e.target as Node)
      ) {
        setCourseDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectCourse(course: Course) {
    setSelectedCourse(course)
    setCourseQuery(course.name)
    setCourseDropdownOpen(false)
    setSelectedUnitId('')
    setCreatingUnit(false)
    setNewUnitTitle('')
  }

  function handleCourseInputChange(value: string) {
    setCourseQuery(value)
    setCourseDropdownOpen(true)
    if (selectedCourse && value !== selectedCourse.name) {
      setSelectedCourse(null)
      setSelectedUnitId('')
      setCreatingUnit(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourse) return
    if (!creatingUnit && !selectedUnitId) return
    if (creatingUnit && !newUnitTitle.trim()) return
    if (!title) return

    setSubmitting(true)
    setError('')

    try {
      let unitId = selectedUnitId

      if (creatingUnit) {
        unitId = await submitNewUnit(selectedCourse.id, newUnitTitle)
      }

      let pdfPath: string | undefined
      if (contentType === 'pdf' && pdfFile) {
        const { signedUrl, path } = await getSignedUploadUrl(pdfFile.name, unitId)
        const res = await fetch(signedUrl, { method: 'PUT', body: pdfFile, headers: { 'Content-Type': 'application/pdf' } })
        if (!res.ok) throw new Error('PDF upload failed')
        pdfPath = path
      }

      await submitMaterial({
        unitId,
        title,
        type,
        contentType,
        pdfPath,
        contentJson: contentType === 'richtext' && contentText ? { text: contentText } : undefined,
      })

      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Submit Study Material</h1>
        <p className="text-white/40 text-sm mt-1">Your submission will be reviewed before going live.</p>
      </div>

      {error && (
        <div className="text-red-400 text-sm glass border-red-400/20 rounded-xl px-4 py-3"
          style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      {/* Course search */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Course</label>
        <div className="relative">
          <input
            ref={courseInputRef}
            value={courseQuery}
            onChange={e => handleCourseInputChange(e.target.value)}
            onFocus={() => setCourseDropdownOpen(true)}
            placeholder="Search for a course..."
            autoComplete="off"
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
          />
          {selectedCourse && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400"
              style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
          )}
          {courseDropdownOpen && courseQuery.length > 0 && filteredCourses.length > 0 && (
            <div
              ref={courseDropdownRef}
              className="absolute z-20 w-full mt-1.5 rounded-xl overflow-hidden border border-white/[0.1]"
              style={{ maxHeight: '220px', overflowY: 'auto', background: '#0d0f24' }}
            >
              {filteredCourses.map(course => (
                <button
                  key={course.id}
                  type="button"
                  onMouseDown={() => selectCourse(course)}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.07] hover:text-white transition-colors"
                >
                  {course.name}
                </button>
              ))}
            </div>
          )}
          {courseDropdownOpen && courseQuery.length > 0 && filteredCourses.length === 0 && (
            <div ref={courseDropdownRef} className="absolute z-20 w-full mt-1.5 rounded-xl px-4 py-3 text-sm text-white/30 border border-white/[0.1]" style={{ background: '#0d0f24' }}>
              No courses found
            </div>
          )}
        </div>
      </div>

      {/* Unit */}
      {selectedCourse && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Unit</label>
            <button
              type="button"
              onClick={() => { setCreatingUnit(v => !v); setSelectedUnitId(''); setNewUnitTitle('') }}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              {creatingUnit ? '← Select existing unit' : '+ Create new unit'}
            </button>
          </div>

          {creatingUnit ? (
            <div className="flex flex-col gap-1.5">
              <input
                value={newUnitTitle}
                onChange={e => setNewUnitTitle(e.target.value)}
                placeholder="e.g. Unit 4: The Cold War"
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                autoFocus
              />
              <p className="text-xs text-white/25 px-1">
                This unit will be reviewed and approved before becoming visible to others.
              </p>
            </div>
          ) : (
            <select
              value={selectedUnitId}
              onChange={e => setSelectedUnitId(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
            >
              <option value="">Select a unit</option>
              {filteredUnits.map(u => (
                <option key={u.id} value={u.id}>{u.title}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
          placeholder="e.g. Unit 3 Review Sheet"
        />
      </div>

      {/* Type + Format toggles */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Type</label>
          <div className="flex gap-2">
            {(['note', 'test'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`btn-press flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  type === t
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'glass text-white/60 hover:text-white'
                }`}>
                {t === 'note' ? 'Study Note' : 'Practice Test'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Format</label>
          <div className="flex gap-2">
            {(['richtext', 'pdf'] as const).map(ct => (
              <button key={ct} type="button" onClick={() => setContentType(ct)}
                className={`btn-press flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  contentType === ct
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'glass text-white/60 hover:text-white'
                }`}>
                {ct === 'richtext' ? 'Text Editor' : 'PDF Upload'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {contentType === 'richtext' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Content</label>
          <textarea
            value={contentText}
            onChange={e => setContentText(e.target.value)}
            placeholder="Type your notes here..."
            rows={12}
            className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-y leading-relaxed"
          />
        </div>
      )}

      {contentType === 'pdf' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">PDF File (max 10MB)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            required
            className="text-white/60 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-600 file:text-white file:font-medium hover:file:bg-violet-500 file:transition-colors"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedCourse || (!creatingUnit && !selectedUnitId) || (creatingUnit && !newUnitTitle.trim()) || !title || (contentType === 'richtext' && !contentText.trim())}
        className="btn-press bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
      >
        {submitting ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  )
}
