import { db } from '../index'
import { materials, users, units, courses, departments } from '../schema'
import { and, eq, ilike, or } from 'drizzle-orm'

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
