'use client'
import { useState } from 'react'
import { submitMaterial, getSignedUploadUrl } from '@/app/actions/materials'
import TiptapEditor from '@/components/editor/TiptapEditor'
import { useRouter } from 'next/navigation'

interface Course { id: string; name: string }
interface Unit { id: string; title: string; courseId: string }

export default function SubmitForm({ courses, units }: { courses: Course[]; units: Unit[] }) {
  const router = useRouter()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'note' | 'test'>('note')
  const [contentType, setContentType] = useState<'pdf' | 'richtext'>('richtext')
  const [contentJson, setContentJson] = useState<object | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const filteredUnits = units.filter(u => u.courseId === selectedCourseId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnitId || !title) return
    setSubmitting(true)
    setError('')

    try {
      let pdfPath: string | undefined

      if (contentType === 'pdf' && pdfFile) {
        const { signedUrl, path } = await getSignedUploadUrl(pdfFile.name, selectedUnitId)
        const res = await fetch(signedUrl, { method: 'PUT', body: pdfFile, headers: { 'Content-Type': 'application/pdf' } })
        if (!res.ok) throw new Error('PDF upload failed')
        pdfPath = path
      }

      await submitMaterial({
        unitId: selectedUnitId,
        title,
        type,
        contentType,
        pdfPath,
        contentJson: contentType === 'richtext' && contentJson ? contentJson : undefined,
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
      <h1 className="text-2xl font-bold text-white">Submit Study Material</h1>

      {error && <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">{error}</div>}

      <div className="flex flex-col gap-1">
        <label className="text-sm text-white/60">Course</label>
        <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setSelectedUnitId('') }}
          required className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500">
          <option value="">Select a course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-white/60">Unit</label>
        <select value={selectedUnitId} onChange={e => setSelectedUnitId(e.target.value)}
          required disabled={!selectedCourseId}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 disabled:opacity-40">
          <option value="">Select a unit</option>
          {filteredUnits.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-white/60">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500"
          placeholder="e.g. Unit 3 Review Sheet" />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm text-white/60">Type</label>
          <div className="flex gap-2">
            {(['note', 'test'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${type === t ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                {t === 'note' ? 'Study Note' : 'Past Test'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm text-white/60">Format</label>
          <div className="flex gap-2">
            {(['richtext', 'pdf'] as const).map(ct => (
              <button key={ct} type="button" onClick={() => setContentType(ct)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${contentType === ct ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
                {ct === 'richtext' ? 'Text Editor' : 'PDF Upload'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {contentType === 'richtext' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Content</label>
          <TiptapEditor onChange={json => setContentJson(json)} />
        </div>
      )}

      {contentType === 'pdf' && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">PDF File (max 10MB)</label>
          <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            required className="text-white/60 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:font-medium hover:file:bg-purple-500" />
        </div>
      )}

      <button type="submit" disabled={submitting}
        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition-colors">
        {submitting ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  )
}
