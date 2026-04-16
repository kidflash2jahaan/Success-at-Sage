import { db } from './index'
import { departments, courses, units } from './schema'

async function seed() {
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

  await db.insert(departments).values({
    name: 'World Languages', slug: 'world-languages', colorAccent: '#f472b6',
  }).returning()

  const mathCourses = await db.insert(courses).values([
    { departmentId: math.id, name: 'Algebra I', slug: 'algebra-i', description: 'Foundations of algebra.' },
    { departmentId: math.id, name: 'Geometry', slug: 'geometry', description: 'Euclidean geometry and proofs.' },
    { departmentId: math.id, name: 'Algebra II', slug: 'algebra-ii', description: 'Advanced algebra topics.' },
    { departmentId: math.id, name: 'Pre-Calculus', slug: 'pre-calculus', description: 'Preparation for calculus.' },
    { departmentId: math.id, name: 'AP Calculus AB', slug: 'ap-calculus-ab', description: 'AP Calculus AB.' },
    { departmentId: math.id, name: 'AP Calculus BC', slug: 'ap-calculus-bc', description: 'AP Calculus BC.' },
    { departmentId: math.id, name: 'AP Statistics', slug: 'ap-statistics', description: 'AP Statistics.' },
  ]).returning()

  await db.insert(courses).values([
    { departmentId: science.id, name: 'Biology', slug: 'biology', description: 'Introductory biology.' },
    { departmentId: science.id, name: 'Chemistry', slug: 'chemistry', description: 'Introductory chemistry.' },
    { departmentId: science.id, name: 'Physics', slug: 'physics', description: 'Introductory physics.' },
    { departmentId: science.id, name: 'AP Biology', slug: 'ap-biology', description: 'AP Biology.' },
    { departmentId: science.id, name: 'AP Chemistry', slug: 'ap-chemistry', description: 'AP Chemistry.' },
    { departmentId: science.id, name: 'AP Physics 1', slug: 'ap-physics-1', description: 'AP Physics 1.' },
    { departmentId: science.id, name: 'AP Physics C', slug: 'ap-physics-c', description: 'AP Physics C: Mechanics.' },
  ])

  await db.insert(courses).values([
    { departmentId: english.id, name: 'English 9', slug: 'english-9', description: 'Freshman English.' },
    { departmentId: english.id, name: 'English 10', slug: 'english-10', description: 'Sophomore English.' },
    { departmentId: english.id, name: 'AP Language & Composition', slug: 'ap-lang', description: 'AP Lang & Comp.' },
    { departmentId: english.id, name: 'AP Literature & Composition', slug: 'ap-lit', description: 'AP Lit & Comp.' },
  ])

  await db.insert(courses).values([
    { departmentId: history.id, name: 'World History', slug: 'world-history', description: 'World History.' },
    { departmentId: history.id, name: 'US History', slug: 'us-history', description: 'US History.' },
    { departmentId: history.id, name: 'AP US History', slug: 'ap-us-history', description: 'APUSH.' },
    { departmentId: history.id, name: 'AP Government', slug: 'ap-government', description: 'AP Gov & Politics.' },
    { departmentId: history.id, name: 'Economics', slug: 'economics', description: 'Economics.' },
  ])

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
