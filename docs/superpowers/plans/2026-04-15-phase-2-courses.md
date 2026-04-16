# Phase 2: Browse & Courses — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> **Prerequisite:** Phase 1 must be complete (schema exists, auth works).

**Goal:** Seed departments and courses, build the public browse page and course/unit detail pages.

**Architecture:** All data fetching in Server Components via Drizzle. Course pages are public (metadata only — no materials shown without login).

---

### Task 1: Seed departments and courses

**Files:** Create `lib/db/seed.ts`

- [ ] Create `lib/db/seed.ts`:
```ts
import { db } from './index'
import { departments, courses, units } from './schema'

async function seed() {
  // Departments
  const [math] = await db.insert(departments).values({
    name: 'Mathematics', slug: 'mathematics', colorAccent: '#a78bfa',
  }).returning()

  const [science] = await db.insert(departments).values({
    name: 'Science', slug: 'science', colorAccent: '#60a5fa',
  }).returning()

  const [english] = await db.insert(departments).values({
    name: 'English', slug: 'english', colorAccent: '#34d399',
  }).returning()

  const [history] = await db.insert(departments).values({
    name: 'History & Social Science', slug: 'history', colorAccent: '#fbbf24',
  }).returning()

  const [languages] = await db.insert(departments).values({
    name: 'World Languages', slug: 'world-languages', colorAccent: '#f472b6',
  }).returning()

  // Math courses
  const mathCourses = await db.insert(courses).values([
    { departmentId: math.id, name: 'Algebra I', slug: 'algebra-i', description: 'Foundations of algebra.' },
    { departmentId: math.id, name: 'Geometry', slug: 'geometry', description: 'Euclidean geometry and proofs.' },
    { departmentId: math.id, name: 'Algebra II', slug: 'algebra-ii', description: 'Advanced algebra topics.' },
    { departmentId: math.id, name: 'Pre-Calculus', slug: 'pre-calculus', description: 'Preparation for calculus.' },
    { departmentId: math.id, name: 'AP Calculus AB', slug: 'ap-calculus-ab', description: 'AP Calculus AB.' },
    { departmentId: math.id, name: 'AP Calculus BC', slug: 'ap-calculus-bc', description: 'AP Calculus BC.' },
    { departmentId: math.id, name: 'AP Statistics', slug: 'ap-statistics', description: 'AP Statistics.' },
  ]).returning()

  // Science courses
  await db.insert(courses).values([
    { departmentId: science.id, name: 'Biology', slug: 'biology', description: 'Introductory biology.' },
    { departmentId: science.id, name: 'Chemistry', slug: 'chemistry', description: 'Introductory chemistry.' },
    { departmentId: science.id, name: 'Physics', slug: 'physics', description: 'Introductory physics.' },
    { departmentId: science.id, name: 'AP Biology', slug: 'ap-biology', description: 'AP Biology.' },
    { departmentId: science.id, name: 'AP Chemistry', slug: 'ap-chemistry', description: 'AP Chemistry.' },
    { departmentId: science.id, name: 'AP Physics 1', slug: 'ap-physics-1', description: 'AP Physics 1.' },
    { departmentId: science.id, name: 'AP Physics C', slug: 'ap-physics-c', description: 'AP Physics C: Mechanics.' },
  ])

  // English courses
  await db.insert(courses).values([
    { departmentId: english.id, name: 'English 9', slug: 'english-9', description: 'Freshman English.' },
    { departmentId: english.id, name: 'English 10', slug: 'english-10', description: 'Sophomore English.' },
    { departmentId: english.id, name: 'AP Language & Composition', slug: 'ap-lang', description: 'AP Lang & Comp.' },
    { departmentId: english.id, name: 'AP Literature & Composition', slug: 'ap-lit', description: 'AP Lit & Comp.' },
  ])

  // History courses
  await db.insert(courses).values([
    { departmentId: history.id, name: 'World History', slug: 'world-history', description: 'World History.' },
    { departmentId: history.id, name: 'US History', slug: 'us-history', description: 'US History.' },
    { departmentId: history.id, name: 'AP US History', slug: 'ap-us-history', description: 'APUSH.' },
    { departmentId: history.id, name: 'AP Government', slug: 'ap-government', description: 'AP Gov & Politics.' },
    { departmentId: history.id, name: 'Economics', slug: 'economics', description: 'Economics.' },
  ])

  // Add placeholder units to AP Calculus BC as example
  const calcBC = mathCourses.find(c => c.slug === 'ap-calculus-bc')!
  await db.insert(units).values([
    { courseId: calcBC.id, title: 'Unit 1: Limits and Continuity', orderIndex: 1 },
    { courseId: calcBC.id, title: 'Unit 2: Differentiation', orderIndex: 2 },
    { courseId: calcBC.id, title: 'Unit 3: Applications of Derivatives', orderIndex: 3 },
    { courseId: calcBC.id, title: 'Unit 4: Integration', orderIndex: 4 },
  ])

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch(console.error)
```
- [ ] Add seed script to `package.json`:
```json
"seed": "npx tsx lib/db/seed.ts"
```
- [ ] Run seed:
```bash
npm run seed
```
Expected: "Seed complete." with no errors.
- [ ] Commit:
```bash
git add lib/db/seed.ts package.json
git commit -m "feat: add database seed with departments and courses"
```

---

### Task 2: Browse page

**Files:** Create `app/browse/page.tsx`, create `lib/db/queries/courses.ts`

- [ ] Create `lib/db/queries/courses.ts`:
```ts
import { db } from '../index'
import { departments, courses, units, materials, userCourses } from '../schema'
import { eq, and, count } from 'drizzle-orm'

export async function getAllDepartmentsWithCourses() {
  const deps = await db.select().from(departments)
  const allCourses = await db.select().from(courses)
  return deps.map(d => ({
    ...d,
    courses: allCourses.filter(c => c.departmentId === d.id),
  }))
}

export async function getCourseBySlug(slug: string) {
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug))
  return course ?? null
}

export async function getCourseWithUnits(slug: string) {
  const course = await getCourseBySlug(slug)
  if (!course) return null
  const [dept] = await db.select().from(departments).where(eq(departments.id, course.departmentId))
  const courseUnits = await db.select().from(units)
    .where(eq(units.courseId, course.id))
    .orderBy(units.orderIndex)
  return { course, department: dept, units: courseUnits }
}

export async function isUserEnrolled(userId: string, courseId: string) {
  const [row] = await db.select().from(userCourses)
    .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)))
  return !!row
}

export async function getUserCourses(userId: string) {
  const rows = await db.select({ course: courses, department: departments })
    .from(userCourses)
    .innerJoin(courses, eq(userCourses.courseId, courses.id))
    .innerJoin(departments, eq(courses.departmentId, departments.id))
    .where(eq(userCourses.userId, userId))
  return rows
}
```
- [ ] Create `app/browse/page.tsx`:
```tsx
import { getAllDepartmentsWithCourses } from '@/lib/db/queries/courses'
import Link from 'next/link'

export default async function BrowsePage() {
  const departments = await getAllDepartmentsWithCourses()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">Browse Courses</h1>
      <p className="text-white/50 mb-10">Find your courses and add them to your schedule.</p>
      <div className="flex flex-col gap-10">
        {departments.map(dept => (
          <div key={dept.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: dept.colorAccent }} />
              <h2 className="text-xl font-semibold text-white">{dept.name}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dept.courses.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: dept.colorAccent }}>
                    {dept.name}
                  </div>
                  <div className="text-white font-medium">{course.name}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/browse/ lib/db/queries/courses.ts
git commit -m "feat: add browse page with departments and courses"
```

---

### Task 3: Course detail page

**Files:** Create `app/courses/[slug]/page.tsx`, create `app/actions/courses.ts`

- [ ] Create `app/actions/courses.ts`:
```ts
'use server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { userCourses, courses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function addCourseToSchedule(courseId: string) {
  const user = await requireUser()
  await db.insert(userCourses).values({ userId: user.id, courseId }).onConflictDoNothing()
  revalidatePath('/dashboard')
  revalidatePath(`/courses`)
}

export async function removeCourseFromSchedule(courseId: string) {
  const user = await requireUser()
  await db.delete(userCourses).where(
    and(eq(userCourses.userId, user.id), eq(userCourses.courseId, courseId))
  )
  revalidatePath('/dashboard')
}
```
- [ ] Create `app/courses/[slug]/page.tsx`:
```tsx
import { getCourseWithUnits, isUserEnrolled } from '@/lib/db/queries/courses'
import { getCurrentUser } from '@/lib/auth'
import { addCourseToSchedule, removeCourseFromSchedule } from '@/app/actions/courses'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getCourseWithUnits(slug)
  if (!data) notFound()

  const { course, department, units } = data
  const user = await getCurrentUser()
  const enrolled = user ? await isUserEnrolled(user.id, course.id) : false

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: department.colorAccent }}>
        {department.name}
      </div>
      <h1 className="text-3xl font-bold text-white mb-4">{course.name}</h1>
      {course.description && <p className="text-white/60 mb-8">{course.description}</p>}

      {user && (
        <form action={enrolled
          ? removeCourseFromSchedule.bind(null, course.id)
          : addCourseToSchedule.bind(null, course.id)
        } className="mb-8">
          <button
            type="submit"
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
              enrolled
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'text-white'
            }`}
            style={enrolled ? {} : { background: department.colorAccent }}
          >
            {enrolled ? 'Remove from Schedule' : '+ Add to My Schedule'}
          </button>
        </form>
      )}

      <h2 className="text-lg font-semibold text-white mb-4">Units</h2>
      {units.length === 0 ? (
        <p className="text-white/40">No units yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {units.map(unit => (
            <Link
              key={unit.id}
              href={user ? `/courses/${slug}/units/${unit.id}` : '/login'}
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-4 transition-colors"
            >
              <span className="text-white">{unit.title}</span>
              <span className="text-white/30 text-sm">View materials →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```
- [ ] Commit:
```bash
git add app/courses/ app/actions/courses.ts
git commit -m "feat: add course detail page with enroll/unenroll"
```

---

**Phase 2 complete.** Move on to Phase 3 (Dashboard).
