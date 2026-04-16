'use server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { materials, users, units } from '@/lib/db/schema'
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
