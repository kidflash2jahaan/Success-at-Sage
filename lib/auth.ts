import { getUser } from './supabase/server'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'

export async function getCurrentUser() {
  const authUser = await getUser()
  if (!authUser) return null
  const [user] = await db.select().from(users).where(eq(users.id, authUser.id))
  return user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('Forbidden')
  return user
}

export function calculateGrade(graduatingYear: number): { grade: number; label: string } {
  const now = new Date()
  const schoolYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const grade = 12 - (graduatingYear - schoolYear - 1)
  const labels: Record<number, string> = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' }
  return { grade, label: labels[grade] ?? `Grade ${grade}` }
}
