import { getUser } from './supabase/server'
import { supabaseAdmin } from './supabase/admin'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const authUser = await getUser()
  if (!authUser) return null
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()
  if (!data) return null
  return {
    id: data.id as string,
    email: data.email as string,
    fullName: data.full_name as string,
    graduatingYear: data.graduating_year as number,
    role: data.role as 'student' | 'admin',
    createdAt: data.created_at as string,
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/dashboard')
  return user
}

export function calculateGrade(graduatingYear: number): { grade: number; label: string } {
  const now = new Date()
  const schoolYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const grade = 12 - (graduatingYear - schoolYear - 1)
  const labels: Record<number, string> = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' }
  return { grade, label: labels[grade] ?? `Grade ${grade}` }
}
