'use client'
import { useState, useRef, useEffect } from 'react'
import { submitMaterial, submitNewUnit } from '@/app/actions/materials'
import { uploadFileWithTUS, uploadPdfWithTUS } from '@/lib/storage/upload'
import FileDropZone from '@/components/ui/FileDropZone'
import PdfDropZone from '@/components/ui/PdfDropZone'
import { useRouter } from 'next/navigation'

interface Course { id: string; name: string; slug: string }
interface Unit { id: string; title: string; courseId: string }

export default function SubmitForm({ courses, units, preselectedSlug, preselectedUnitId }: { courses: Course[]; units: Unit[]; preselectedSlug?: string; preselectedUnitId?: string }) {
  const router = useRouter()

  const initialCourse = preselectedSlug ? (courses.find(c => c.slug === preselectedSlug) ?? null) : null

  const [courseQuery, setCourseQuery] = useState(initialCourse?.name ?? '')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse)
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false)
  const courseInputRef = useRef<HTMLInputElement>(null)
  const courseDropdownRef = useRef<HTMLDivElement>(null)

  const [selectedUnitId, setSelectedUnitId] = useState(preselectedUnitId ?? '')
  const [creatingUnit, setCreatingUnit] = useState(false)
  const [newUnitTitle, setNewUnitTitle] = useState('')

  const [mode, setMode] = useState<'typed' | 'paper'>('paper')
  const [title, setTitle] = useState('')
  const [contentText, setContentText] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(courseQuery.toLowerCase())
  )
  const filteredUnits = units.filter(u => u.courseId === selectedCourse?.id)

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

      if (mode === 'paper') {
        if (!pdfFile) throw new Error('Please select a PDF file.')
        const pdfPath = await uploadPdfWithTUS(pdfFile, unitId)
        await submitMaterial({ unitId, title, type: 'note', contentType: 'pdf', contentText: '', pdfPath })
      } else {
        const attachmentPaths: string[] = []
        for (const file of attachmentFiles) {
          const path = await uploadFileWithTUS(file, unitId)
          attachmentPaths.push(path)
        }
        await submitMaterial({
          unitId,
          title,
          type: 'note',
          contentType: 'richtext',
          contentText,
          attachmentPaths: attachmentPaths.length ? attachmentPaths : undefined,
        })
      }

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

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 glass rounded-xl">
        {(['paper', 'typed'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}>
            {m === 'typed' ? 'Typed' : 'Paper (PDF)'}
          </button>
        ))}
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

      {mode === 'typed' ? (
        <>
          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Content <span className="text-white/25 normal-case">(optional)</span></label>
            <textarea
              value={contentText}
              onChange={e => setContentText(e.target.value)}
              placeholder="Type your notes here..."
              rows={12}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-y leading-relaxed"
            />
          </div>

          <FileDropZone files={attachmentFiles} onChange={setAttachmentFiles} />
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wider">PDF File <span className="text-rose-400/60 normal-case">required</span></label>
          <PdfDropZone file={pdfFile} onChange={setPdfFile} />
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedCourse || (!creatingUnit && !selectedUnitId) || (creatingUnit && !newUnitTitle.trim()) || !title || (mode === 'paper' && !pdfFile)}
        className="btn-press bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all hover:shadow-[0_0_24px_rgba(124,58,237,0.4)]"
      >
        {submitting ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  )
}
