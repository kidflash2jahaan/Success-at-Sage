import { db } from './index'
import { departments, courses, units } from './schema'

// The Sage tenant UUID, fixed at migration 0002. Only used here by the
// initial seed script.
const SAGE_SCHOOL_ID = 'a0000000-0000-0000-0000-000000000001'

async function seed() {
  const [math] = await db.insert(departments).values({
    schoolId: SAGE_SCHOOL_ID, name: 'Mathematics', slug: 'mathematics', colorAccent: '#a78bfa',
  }).returning()

  const [science] = await db.insert(departments).values({
    schoolId: SAGE_SCHOOL_ID, name: 'Science', slug: 'science', colorAccent: '#60a5fa',
  }).returning()

  const [english] = await db.insert(departments).values({
    schoolId: SAGE_SCHOOL_ID, name: 'English', slug: 'english', colorAccent: '#34d399',
  }).returning()

  const [history] = await db.insert(departments).values({
    schoolId: SAGE_SCHOOL_ID, name: 'History & Social Science', slug: 'history', colorAccent: '#fbbf24',
  }).returning()

  await db.insert(departments).values({
    schoolId: SAGE_SCHOOL_ID, name: 'World Languages', slug: 'world-languages', colorAccent: '#f472b6',
  }).returning()

  const mathCourses = await db.insert(courses).values([
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'Algebra I', slug: 'algebra-i', description: 'Foundations of algebra.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'Geometry', slug: 'geometry', description: 'Euclidean geometry and proofs.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'Algebra II', slug: 'algebra-ii', description: 'Advanced algebra topics.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'Pre-Calculus', slug: 'pre-calculus', description: 'Preparation for calculus.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'AP Calculus AB', slug: 'ap-calculus-ab', description: 'AP Calculus AB.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'AP Calculus BC', slug: 'ap-calculus-bc', description: 'AP Calculus BC.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: math.id, name: 'AP Statistics', slug: 'ap-statistics', description: 'AP Statistics.' },
  ]).returning()

  await db.insert(courses).values([
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'Biology', slug: 'biology', description: 'Introductory biology.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'Chemistry', slug: 'chemistry', description: 'Introductory chemistry.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'Physics', slug: 'physics', description: 'Introductory physics.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'AP Biology', slug: 'ap-biology', description: 'AP Biology.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'AP Chemistry', slug: 'ap-chemistry', description: 'AP Chemistry.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'AP Physics 1', slug: 'ap-physics-1', description: 'AP Physics 1.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: science.id, name: 'AP Physics C', slug: 'ap-physics-c', description: 'AP Physics C: Mechanics.' },
  ])

  await db.insert(courses).values([
    { schoolId: SAGE_SCHOOL_ID, departmentId: english.id, name: 'English 9', slug: 'english-9', description: 'Freshman English.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: english.id, name: 'English 10', slug: 'english-10', description: 'Sophomore English.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: english.id, name: 'AP Language & Composition', slug: 'ap-lang', description: 'AP Lang & Comp.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: english.id, name: 'AP Literature & Composition', slug: 'ap-lit', description: 'AP Lit & Comp.' },
  ])

  await db.insert(courses).values([
    { schoolId: SAGE_SCHOOL_ID, departmentId: history.id, name: 'World History', slug: 'world-history', description: 'World History.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: history.id, name: 'US History', slug: 'us-history', description: 'US History.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: history.id, name: 'AP US History', slug: 'ap-us-history', description: 'APUSH.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: history.id, name: 'AP Government', slug: 'ap-government', description: 'AP Gov & Politics.' },
    { schoolId: SAGE_SCHOOL_ID, departmentId: history.id, name: 'Economics', slug: 'economics', description: 'Economics.' },
  ])

  const calcBC = mathCourses.find(c => c.slug === 'ap-calculus-bc')!
  await db.insert(units).values([
    { schoolId: SAGE_SCHOOL_ID, courseId: calcBC.id, title: 'Unit 1: Limits and Continuity', orderIndex: 1 },
    { schoolId: SAGE_SCHOOL_ID, courseId: calcBC.id, title: 'Unit 2: Differentiation', orderIndex: 2 },
    { schoolId: SAGE_SCHOOL_ID, courseId: calcBC.id, title: 'Unit 3: Applications of Derivatives', orderIndex: 3 },
    { schoolId: SAGE_SCHOOL_ID, courseId: calcBC.id, title: 'Unit 4: Integration', orderIndex: 4 },
  ])

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch(console.error)
