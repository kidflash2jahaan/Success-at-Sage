import { db } from '../index'
import { departments, courses, units, userCourses } from '../schema'
import { eq, and } from 'drizzle-orm'

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
