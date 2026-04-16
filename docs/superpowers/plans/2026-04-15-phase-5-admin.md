# Phase 5: Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Prerequisite:** Phase 4 must be complete.

**Goal:** Build the full admin panel — submission review queue with approve/reject + Resend email, course/unit management, and user management. All admin routes return 404 to non-admins.

---

### Task 1: Admin layout with 404 guard

**Files:** Create `app/(admin)/layout.tsx`

- [ ] Create `app/(admin)/layout.tsx`:
```tsx
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    notFound()
  }

  return (
    <div className="flex h-screen bg-[#1a1a2e]">
      <nav className="w-52 shrink-0 bg-[#16213e] border-r border-white/10 flex flex-col p-4 gap-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 px-2">Admin</div>
        {[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/submissions', label: 'Submissions' },
          { href: '/admin/courses', label: 'Courses' },
          { href: '/admin/users', label: 'Users' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-white/10">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm text-purple-400 hover:text-purple-300 block">
            ← Student View
          </Link>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(admin)/layout.tsx
git commit -m "feat: add admin layout with 404 guard for non-admins"
```

---

### Task 2: Admin dashboard page

**Files:** Create `app/(admin)/admin/page.tsx`

- [ ] Create `app/(admin)/admin/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { materials, users } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export default async function AdminDashboardPage() {
  const [pendingResult] = await db.select({ count: count() }).from(materials).where(eq(materials.status, 'pending'))
  const [totalUsers] = await db.select({ count: count() }).from(users)
  const [totalMaterials] = await db.select({ count: count() }).from(materials).where(eq(materials.status, 'approved'))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {[
          { label: 'Pending Review', value: pendingResult.count, color: '#fbbf24' },
          { label: 'Total Users', value: totalUsers.count, color: '#60a5fa' },
          { label: 'Approved Materials', value: totalMaterials.count, color: '#34d399' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-white/50 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(admin)/admin/page.tsx
git commit -m "feat: add admin dashboard with stats"
```

---

### Task 3: Resend email helper

**Files:** Create `lib/email/resend.ts`

- [ ] Create `lib/email/resend.ts`:
```ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendApprovalEmail(to: string, materialTitle: string) {
  await resend.emails.send({
    from: 'Success at Sage <noreply@successatsage.com>',
    to,
    subject: 'Your submission was approved!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#a78bfa">Your submission was approved ✓</h2>
        <p>Your material <strong>${materialTitle}</strong> has been approved and is now live on Success at Sage.</p>
        <p>Thank you for contributing!</p>
      </div>
    `,
  })
}

export async function sendRejectionEmail(to: string, materialTitle: string, note?: string | null) {
  await resend.emails.send({
    from: 'Success at Sage <noreply@successatsage.com>',
    to,
    subject: 'Update on your submission',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#f87171">Submission not approved</h2>
        <p>Your material <strong>${materialTitle}</strong> was not approved at this time.</p>
        ${note ? `<p><strong>Feedback:</strong> ${note}</p>` : ''}
        <p>Feel free to make changes and resubmit!</p>
      </div>
    `,
  })
}
```
- [ ] Commit:
```bash
git add lib/email/resend.ts
git commit -m "feat: add Resend email helpers for approval/rejection"
```

---

### Task 4: Submission review queue

**Files:** Create `app/(admin)/admin/submissions/page.tsx`, create `app/actions/admin.ts`

- [ ] Create `app/actions/admin.ts`:
```ts
'use server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { materials, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

export async function approveMaterial(materialId: string) {
  await requireAdmin()
  const [material] = await db.select({
    id: materials.id,
    title: materials.title,
    uploadedBy: materials.uploadedBy,
  }).from(materials).where(eq(materials.id, materialId))

  await db.update(materials).set({ status: 'approved' }).where(eq(materials.id, materialId))

  const [uploader] = await db.select({ email: users.email }).from(users).where(eq(users.id, material.uploadedBy))
  await sendApprovalEmail(uploader.email, material.title)

  revalidatePath('/admin/submissions')
}

export async function rejectMaterial(materialId: string, note: string) {
  await requireAdmin()
  const [material] = await db.select({
    id: materials.id,
    title: materials.title,
    uploadedBy: materials.uploadedBy,
  }).from(materials).where(eq(materials.id, materialId))

  await db.update(materials)
    .set({ status: 'rejected', rejectionNote: note || null })
    .where(eq(materials.id, materialId))

  const [uploader] = await db.select({ email: users.email }).from(users).where(eq(users.id, material.uploadedBy))
  await sendRejectionEmail(uploader.email, material.title, note)

  revalidatePath('/admin/submissions')
}
```
- [ ] Create `app/(admin)/admin/submissions/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { materials, users, units, courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SubmissionReviewer from '@/components/admin/SubmissionReviewer'

export default async function SubmissionsPage() {
  const pending = await db.select({
    id: materials.id,
    title: materials.title,
    type: materials.type,
    contentType: materials.contentType,
    contentJson: materials.contentJson,
    pdfPath: materials.pdfPath,
    createdAt: materials.createdAt,
    uploaderName: users.fullName,
    uploaderEmail: users.email,
    unitTitle: units.title,
    courseName: courses.name,
  })
    .from(materials)
    .innerJoin(users, eq(materials.uploadedBy, users.id))
    .innerJoin(units, eq(materials.unitId, units.id))
    .innerJoin(courses, eq(units.courseId, courses.id))
    .where(eq(materials.status, 'pending'))
    .orderBy(materials.createdAt)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Pending Submissions</h1>
      <p className="text-white/40 mb-8">{pending.length} awaiting review</p>
      {pending.length === 0 ? (
        <p className="text-white/30">All caught up!</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl">
          {pending.map(item => <SubmissionReviewer key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
```
- [ ] Create `components/admin/SubmissionReviewer.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { approveMaterial, rejectMaterial } from '@/app/actions/admin'
import MaterialViewer from '@/components/materials/MaterialViewer'

interface SubmissionItem {
  id: string
  title: string
  type: string
  contentType: 'pdf' | 'richtext'
  contentJson: unknown
  pdfPath: string | null
  uploaderName: string
  uploaderEmail: string
  unitTitle: string
  courseName: string
}

export default function SubmissionReviewer({ item }: { item: SubmissionItem }) {
  const [expanded, setExpanded] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-white font-medium">{item.title}</div>
          <div className="text-white/40 text-xs mt-0.5">
            {item.courseName} · {item.unitTitle} · by {item.uploaderName}
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60 capitalize">{item.type}</span>
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">{item.contentType === 'pdf' ? 'PDF' : 'Text'}</span>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-purple-400 hover:text-purple-300 text-sm shrink-0">
          {expanded ? 'Hide' : 'Preview'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/10">
          <MaterialViewer material={{ contentType: item.contentType, contentJson: item.contentJson, pdfPath: item.pdfPath }} />
        </div>
      )}

      <div className="px-5 py-3 border-t border-white/10 flex flex-col gap-3">
        {rejecting ? (
          <>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Rejection reason (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 resize-none" rows={2} />
            <div className="flex gap-2">
              <form action={rejectMaterial.bind(null, item.id, note)} className="flex-1">
                <button type="submit" className="w-full bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  Confirm Reject
                </button>
              </form>
              <button onClick={() => setRejecting(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-sm py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <form action={approveMaterial.bind(null, item.id)} className="flex-1">
              <button type="submit" className="w-full bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                ✓ Approve
              </button>
            </form>
            <button onClick={() => setRejecting(true)} className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 rounded-lg transition-colors border border-red-600/30">
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(admin)/admin/submissions/ app/actions/admin.ts components/admin/
git commit -m "feat: add admin submission review queue with approve/reject and email notifications"
```

---

### Task 5: Admin course management

**Files:** Create `app/(admin)/admin/courses/page.tsx`, add course actions to `app/actions/admin.ts`

- [ ] Add to `app/actions/admin.ts`:
```ts
export async function createUnit(courseId: string, title: string, orderIndex: number) {
  await requireAdmin()
  await db.insert(units).values({ courseId, title, orderIndex })
  revalidatePath('/admin/courses')
}

export async function deleteUnit(unitId: string) {
  await requireAdmin()
  await db.delete(units).where(eq(units.id, unitId))
  revalidatePath('/admin/courses')
}
```
- [ ] Create `app/(admin)/admin/courses/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { departments, courses, units } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createUnit, deleteUnit } from '@/app/actions/admin'

export default async function AdminCoursesPage() {
  const deps = await db.select().from(departments)
  const allCourses = await db.select().from(courses).orderBy(courses.name)
  const allUnits = await db.select().from(units).orderBy(units.orderIndex)

  const depsWithCourses = deps.map(d => ({
    ...d,
    courses: allCourses
      .filter(c => c.departmentId === d.id)
      .map(c => ({
        ...c,
        units: allUnits.filter(u => u.courseId === c.id),
      })),
  }))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Course Management</h1>
      {depsWithCourses.map(dept => (
        <div key={dept.id} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: dept.colorAccent }} />
            <h2 className="text-lg font-semibold text-white">{dept.name}</h2>
          </div>
          {dept.courses.map(course => (
            <div key={course.id} className="mb-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white font-medium mb-3">{course.name}</div>
              <div className="flex flex-col gap-1 mb-3">
                {course.units.map(unit => (
                  <div key={unit.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-white/70 text-sm">{unit.title}</span>
                    <form action={deleteUnit.bind(null, unit.id)}>
                      <button type="submit" className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
              <form action={async (formData: FormData) => {
                'use server'
                const title = formData.get('title') as string
                if (title) await createUnit(course.id, title, course.units.length + 1)
              }} className="flex gap-2">
                <input name="title" placeholder="New unit title..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500" />
                <button type="submit" className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg">Add</button>
              </form>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(admin)/admin/courses/
git commit -m "feat: add admin course management page"
```

---

### Task 6: Admin user management

**Files:** Create `app/(admin)/admin/users/page.tsx`, add user actions to `app/actions/admin.ts`

- [ ] Add to `app/actions/admin.ts`:
```ts
export async function promoteToAdmin(userId: string) {
  await requireAdmin()
  await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId))
  revalidatePath('/admin/users')
}

export async function demoteToStudent(userId: string) {
  await requireAdmin()
  await db.update(users).set({ role: 'student' }).where(eq(users.id, userId))
  revalidatePath('/admin/users')
}
```
- [ ] Create `app/(admin)/admin/users/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { orderBy } from 'drizzle-orm'
import { promoteToAdmin, demoteToStudent } from '@/app/actions/admin'
import { calculateGrade } from '@/lib/auth'

export default async function AdminUsersPage() {
  const allUsers = await db.select().from(users).orderBy(users.createdAt)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">Users ({allUsers.length})</h1>
      <div className="flex flex-col gap-2 max-w-2xl">
        {allUsers.map(user => {
          const { label } = calculateGrade(user.graduatingYear)
          return (
            <div key={user.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <div>
                <div className="text-white font-medium">{user.fullName}</div>
                <div className="text-white/40 text-xs">{user.email} · {label} · Class of {user.graduatingYear}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  user.role === 'admin'
                    ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                    : 'border-white/10 text-white/40'
                }`}>{user.role}</span>
                {user.role === 'student' ? (
                  <form action={promoteToAdmin.bind(null, user.id)}>
                    <button type="submit" className="text-xs text-purple-400 hover:text-purple-300">Make Admin</button>
                  </form>
                ) : (
                  <form action={demoteToStudent.bind(null, user.id)}>
                    <button type="submit" className="text-xs text-white/30 hover:text-white/60">Remove Admin</button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(admin)/admin/users/
git commit -m "feat: add admin user management with promote/demote"
```

---

**Phase 5 complete.** Move on to Phase 6 (Polish).
