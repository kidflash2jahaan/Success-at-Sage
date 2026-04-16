# Phase 4: Content (Submit & View) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Prerequisite:** Phase 3 must be complete.

**Goal:** Students can submit study materials (PDF or rich text), and can view approved materials on unit pages. View count increments on open.

---

### Task 1: Supabase Storage bucket setup

**Files:** No code files — Supabase dashboard config only.

- [ ] In the Supabase dashboard, go to Storage → New Bucket.
- [ ] Create bucket named `materials` with these settings:
  - Public: **No** (private — only signed URLs)
  - File size limit: 10MB
  - Allowed MIME types: `application/pdf`
- [ ] In Storage → Policies, add a policy on `materials` bucket:
  - Name: `Authenticated users can upload`
  - Operation: INSERT
  - Using expression: `auth.role() = 'authenticated'`
- [ ] Add a second policy:
  - Name: `Authenticated users can read`
  - Operation: SELECT
  - Using expression: `auth.role() = 'authenticated'`
- [ ] Commit note:
```bash
git commit --allow-empty -m "chore: supabase storage bucket configured (manual step)"
```

---

### Task 2: PDF upload server action

**Files:** Create `app/actions/materials.ts`

- [ ] Create `app/actions/materials.ts`:
```ts
'use server'
import { requireUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { materials } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getSignedUploadUrl(fileName: string, unitId: string) {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const path = `${user.id}/${unitId}/${Date.now()}-${fileName}`
  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUploadUrl(path)
  if (error || !data) throw new Error('Could not create upload URL')
  return { signedUrl: data.signedUrl, path }
}

export async function submitMaterial(input: {
  unitId: string
  title: string
  type: 'note' | 'test'
  contentType: 'pdf' | 'richtext'
  pdfPath?: string
  contentJson?: object
}) {
  const user = await requireUser()
  await db.insert(materials).values({
    unitId: input.unitId,
    uploadedBy: user.id,
    title: input.title,
    type: input.type,
    contentType: input.contentType,
    pdfPath: input.pdfPath ?? null,
    contentJson: input.contentJson ?? null,
    status: 'pending',
  })
  revalidatePath('/profile')
}

export async function incrementViewCount(materialId: string) {
  await db.update(materials)
    .set({ viewCount: db.$count(materials, eq(materials.id, materialId)) })
    .where(eq(materials.id, materialId))
}
```

Wait — `$count` is wrong for an increment. Replace `incrementViewCount` with:
```ts
import { sql } from 'drizzle-orm'

export async function incrementViewCount(materialId: string) {
  await requireUser()
  await db.update(materials)
    .set({ viewCount: sql`${materials.viewCount} + 1` })
    .where(eq(materials.id, materialId))
}
```
- [ ] Commit:
```bash
git add app/actions/materials.ts
git commit -m "feat: add material submission and view count server actions"
```

---

### Task 3: Tiptap editor component

**Files:** Create `components/editor/TiptapEditor.tsx`

- [ ] Install Tiptap:
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```
- [ ] Create `components/editor/TiptapEditor.tsx`:
```tsx
'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface TiptapEditorProps {
  onChange: (json: object) => void
  initialContent?: object
}

export default function TiptapEditor({ onChange, initialContent }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent ?? '',
    onUpdate({ editor }) {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10">
        {[
          { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
          { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
          { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
          { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
          { label: '•', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        ].map(btn => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              btn.active ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
```
- [ ] Commit:
```bash
git add components/editor/ package.json package-lock.json
git commit -m "feat: add Tiptap rich text editor component"
```

---

### Task 4: Submit form page

**Files:** Create `app/(app)/submit/page.tsx`, create `components/submit/SubmitForm.tsx`

- [ ] Create `components/submit/SubmitForm.tsx`:
```tsx
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

  const filteredUnits = units.filter(u => u.courseId === selectedCourseId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnitId || !title) return
    setSubmitting(true)

    try {
      let pdfPath: string | undefined

      if (contentType === 'pdf' && pdfFile) {
        const { signedUrl, path } = await getSignedUploadUrl(pdfFile.name, selectedUnitId)
        await fetch(signedUrl, { method: 'PUT', body: pdfFile, headers: { 'Content-Type': 'application/pdf' } })
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Submit Study Material</h1>

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
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${type === t ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}>
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
```
- [ ] Create `app/(app)/submit/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { courses, units, departments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SubmitForm from '@/components/submit/SubmitForm'

export default async function SubmitPage() {
  await requireUser()
  const allCourses = await db.select().from(courses).orderBy(courses.name)
  const allUnits = await db.select().from(units).orderBy(units.orderIndex)

  return (
    <SubmitForm
      courses={allCourses.map(c => ({ id: c.id, name: c.name }))}
      units={allUnits.map(u => ({ id: u.id, title: u.title, courseId: u.courseId }))}
    />
  )
}
```
- [ ] Commit:
```bash
git add app/(app)/submit/ components/submit/
git commit -m "feat: add material submit form with PDF upload and rich text"
```

---

### Task 5: Unit page with materials

**Files:** Create `app/courses/[slug]/units/[id]/page.tsx`, create `lib/db/queries/materials.ts`

- [ ] Create `lib/db/queries/materials.ts`:
```ts
import { db } from '../index'
import { materials, users } from '../schema'
import { and, eq } from 'drizzle-orm'

export async function getApprovedMaterialsForUnit(unitId: string) {
  return db.select({
    id: materials.id,
    title: materials.title,
    type: materials.type,
    contentType: materials.contentType,
    contentJson: materials.contentJson,
    pdfPath: materials.pdfPath,
    viewCount: materials.viewCount,
    createdAt: materials.createdAt,
    uploaderName: users.fullName,
  })
    .from(materials)
    .innerJoin(users, eq(materials.uploadedBy, users.id))
    .where(and(eq(materials.unitId, unitId), eq(materials.status, 'approved')))
    .orderBy(materials.createdAt)
}
```
- [ ] Create `app/courses/[slug]/units/[id]/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { units, courses, departments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getApprovedMaterialsForUnit } from '@/lib/db/queries/materials'
import MaterialCard from '@/components/materials/MaterialCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  await requireUser()
  const { slug, id } = await params

  const [unit] = await db.select().from(units).where(eq(units.id, id))
  if (!unit) notFound()

  const [course] = await db.select().from(courses).where(eq(courses.id, unit.courseId))
  const [dept] = await db.select().from(departments).where(eq(departments.id, course.departmentId))
  const approvedMaterials = await getApprovedMaterialsForUnit(id)

  const notes = approvedMaterials.filter(m => m.type === 'note')
  const tests = approvedMaterials.filter(m => m.type === 'test')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: dept.colorAccent }}>
        <Link href={`/courses/${slug}`} className="hover:underline">{course.name}</Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{unit.title}</h1>
      <div className="flex items-center justify-between mb-8">
        <p className="text-white/40 text-sm">{approvedMaterials.length} materials</p>
        <Link href={`/submit`} className="text-sm text-purple-400 hover:text-purple-300">+ Submit Material</Link>
      </div>

      {notes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-3">Study Notes</h2>
          <div className="flex flex-col gap-2">
            {notes.map(m => <MaterialCard key={m.id} material={m} accentColor={dept.colorAccent} />)}
          </div>
        </section>
      )}

      {tests.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-3">Past Tests</h2>
          <div className="flex flex-col gap-2">
            {tests.map(m => <MaterialCard key={m.id} material={m} accentColor={dept.colorAccent} />)}
          </div>
        </section>
      )}

      {approvedMaterials.length === 0 && (
        <p className="text-white/30 text-center py-12">No materials yet. Be the first to submit!</p>
      )}
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/courses/\[slug\]/units/ lib/db/queries/materials.ts
git commit -m "feat: add unit page with approved materials list"
```

---

### Task 6: Material card and viewer

**Files:** Create `components/materials/MaterialCard.tsx`, create `components/materials/MaterialViewer.tsx`

- [ ] Create `components/materials/MaterialCard.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { incrementViewCount } from '@/app/actions/materials'
import MaterialViewer from './MaterialViewer'

interface Material {
  id: string
  title: string
  type: 'note' | 'test'
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
  viewCount: number
  uploaderName: string
}

export default function MaterialCard({ material, accentColor }: { material: Material; accentColor: string }) {
  const [open, setOpen] = useState(false)
  const [viewCount, setViewCount] = useState(material.viewCount)

  async function handleOpen() {
    if (!open) {
      setOpen(true)
      const newCount = await incrementViewCount(material.id)
      setViewCount(v => v + 1)
    } else {
      setOpen(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button onClick={handleOpen} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
        <div>
          <div className="text-white font-medium">{material.title}</div>
          <div className="text-white/40 text-xs mt-0.5">by {material.uploaderName} · {viewCount} views</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full border" style={{ color: accentColor, borderColor: `${accentColor}40` }}>
            {material.contentType === 'pdf' ? 'PDF' : 'Text'}
          </span>
          <svg className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/10">
          <MaterialViewer material={material} />
        </div>
      )}
    </div>
  )
}
```
- [ ] Create `components/materials/MaterialViewer.tsx`:
```tsx
'use client'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface Material {
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
}

export default function MaterialViewer({ material }: { material: Material }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (material.contentType === 'pdf' && material.pdfPath) {
      const supabase = createSupabaseBrowserClient()
      supabase.storage.from('materials').createSignedUrl(material.pdfPath, 3600)
        .then(({ data }) => { if (data) setPdfUrl(data.signedUrl) })
    }
  }, [material])

  if (material.contentType === 'richtext') {
    const html = generateHTML(material.contentJson as object, [StarterKit])
    return (
      <div
        className="prose prose-invert max-w-none p-5 text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  if (!pdfUrl) return <div className="p-5 text-white/40 text-sm">Loading PDF...</div>

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-[600px]"
      title="PDF Viewer"
    />
  )
}
```
- [ ] Commit:
```bash
git add components/materials/
git commit -m "feat: add material card with inline viewer for PDF and rich text"
```

---

**Phase 4 complete.** Move on to Phase 5 (Admin).
