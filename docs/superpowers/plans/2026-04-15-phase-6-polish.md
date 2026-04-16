# Phase 6: Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Prerequisite:** Phase 5 must be complete.

**Goal:** Global search, profile page, and landing page.

---

### Task 1: Search page

**Files:** Create `app/(app)/search/page.tsx`, add search query to `lib/db/queries/materials.ts`

- [ ] Add to `lib/db/queries/materials.ts`:
```ts
import { ilike, or } from 'drizzle-orm'

export async function searchContent(query: string) {
  const term = `%${query}%`
  const matchedCourses = await db.select({
    id: courses.id,
    name: courses.name,
    slug: courses.slug,
    departmentName: departments.name,
    colorAccent: departments.colorAccent,
  })
    .from(courses)
    .innerJoin(departments, eq(courses.departmentId, departments.id))
    .where(ilike(courses.name, term))
    .limit(5)

  const matchedMaterials = await db.select({
    id: materials.id,
    title: materials.title,
    type: materials.type,
    unitId: materials.unitId,
    unitTitle: units.title,
    courseSlug: courses.slug,
    courseName: courses.name,
  })
    .from(materials)
    .innerJoin(units, eq(materials.unitId, units.id))
    .innerJoin(courses, eq(units.courseId, courses.id))
    .where(and(ilike(materials.title, term), eq(materials.status, 'approved')))
    .limit(10)

  return { courses: matchedCourses, materials: matchedMaterials }
}
```
- [ ] Create `app/(app)/search/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth'
import { searchContent } from '@/lib/db/queries/materials'
import Link from 'next/link'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireUser()
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  if (!query) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Search</h1>
        <p className="text-white/40">Enter a query in the search bar above.</p>
      </div>
    )
  }

  const { courses, materials } = await searchContent(query)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">Results for &ldquo;{query}&rdquo;</h1>
      <p className="text-white/40 mb-8">{courses.length + materials.length} results</p>

      {courses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Courses</h2>
          <div className="flex flex-col gap-2">
            {courses.map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: course.colorAccent }} />
                <div>
                  <div className="text-white font-medium">{course.name}</div>
                  <div className="text-white/40 text-xs">{course.departmentName}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {materials.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Materials</h2>
          <div className="flex flex-col gap-2">
            {materials.map(m => (
              <Link key={m.id} href={`/courses/${m.courseSlug}/units/${m.unitId}`}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors">
                <div>
                  <div className="text-white font-medium">{m.title}</div>
                  <div className="text-white/40 text-xs">{m.courseName} · {m.unitTitle}</div>
                </div>
                <span className="text-xs text-white/30 capitalize">{m.type}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 && materials.length === 0 && (
        <p className="text-white/30">No results found.</p>
      )}
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(app)/search/ lib/db/queries/materials.ts
git commit -m "feat: add global search page for courses and materials"
```

---

### Task 2: Profile page

**Files:** Create `app/(app)/profile/page.tsx`, add profile queries to `lib/db/queries/materials.ts`

- [ ] Add to `lib/db/queries/materials.ts`:
```ts
export async function getUserSubmissions(userId: string) {
  return db.select({
    id: materials.id,
    title: materials.title,
    type: materials.type,
    status: materials.status,
    rejectionNote: materials.rejectionNote,
    createdAt: materials.createdAt,
    unitTitle: units.title,
    courseName: courses.name,
  })
    .from(materials)
    .innerJoin(units, eq(materials.unitId, units.id))
    .innerJoin(courses, eq(units.courseId, courses.id))
    .where(eq(materials.uploadedBy, userId))
    .orderBy(materials.createdAt)
}
```
- [ ] Create `app/(app)/profile/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth'
import { calculateGrade } from '@/lib/auth'
import { getUserSubmissions } from '@/lib/db/queries/materials'

export default async function ProfilePage() {
  const user = await requireUser()
  const { label } = calculateGrade(user.graduatingYear)
  const submissions = await getUserSubmissions(user.id)

  const statusColor: Record<string, string> = {
    approved: '#34d399',
    pending: '#fbbf24',
    rejected: '#f87171',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
        <p className="text-white/50 mt-1">{label} · Class of {user.graduatingYear}</p>
        <p className="text-white/40 text-sm mt-1">{user.email}</p>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">My Submissions ({submissions.length})</h2>
      {submissions.length === 0 ? (
        <p className="text-white/30">You haven&apos;t submitted anything yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map(s => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-start justify-between gap-4">
              <div>
                <div className="text-white font-medium">{s.title}</div>
                <div className="text-white/40 text-xs mt-0.5">{s.courseName} · {s.unitTitle}</div>
                {s.status === 'rejected' && s.rejectionNote && (
                  <div className="text-red-400/80 text-xs mt-1">Feedback: {s.rejectionNote}</div>
                )}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full border shrink-0 capitalize"
                style={{ color: statusColor[s.status], borderColor: `${statusColor[s.status]}40` }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/(app)/profile/
git commit -m "feat: add profile page with submissions and status"
```

---

### Task 3: Landing page

**Files:** Modify `app/page.tsx`

- [ ] Replace `app/page.tsx` with:
```tsx
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="font-bold text-white">Success at Sage</span>
        <div className="flex items-center gap-4">
          <Link href="/browse" className="text-sm text-white/60 hover:text-white">Browse Courses</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white">Sign In</Link>
          <Link href="/signup" className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl">
          <div className="inline-block text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded-full px-3 py-1 mb-6">
            For Sage Hill High School Students
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Study smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Ace every test.
            </span>
          </h1>
          <p className="text-xl text-white/50 mb-10">
            Student-submitted study notes and past tests, organized by course and unit. Made by Sage Hill students, for Sage Hill students.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">
              Create Free Account
            </Link>
            <Link href="/browse" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors">
              Browse Courses
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-white/10 text-center text-white/20 text-sm">
        Success at Sage — A passion project for Sage Hill High School
      </footer>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/page.tsx
git commit -m "feat: add landing page"
```

---

### Task 4: Final smoke test

- [ ] Run the dev server:
```bash
npm run dev
```
- [ ] Visit `http://localhost:3000` — landing page loads.
- [ ] Sign up with a new account — onboarding page appears, then dashboard.
- [ ] Browse `/browse` — departments and courses visible.
- [ ] Add a course — appears in sidebar.
- [ ] Visit a unit page — empty materials list shows.
- [ ] Submit a material (rich text) — appears in profile as "pending".
- [ ] Sign in with admin account — `/admin` loads.
- [ ] Approve the submission — status changes, email sent.
- [ ] Visit the unit page again — material is visible.
- [ ] Search for a course — results appear.
- [ ] Commit:
```bash
git commit --allow-empty -m "chore: smoke test passed - all phases complete"
```

---

**All phases complete.** The app is ready for deployment. Run `npm run build` to verify a clean production build, then deploy to Vercel.
