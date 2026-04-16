'use server'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { userCourses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function addCourseToSchedule(courseId: string) {
  const user = await requireUser()
  await db.insert(userCourses).values({ userId: user.id, courseId }).onConflictDoNothing()
  revalidatePath('/dashboard')
  revalidatePath('/courses')
}

export async function removeCourseFromSchedule(courseId: string) {
  const user = await requireUser()
  await db.delete(userCourses).where(
    and(eq(userCourses.userId, user.id), eq(userCourses.courseId, courseId))
  )
  revalidatePath('/dashboard')
}
