import { getUser } from './supabase/server'
import { supabaseAdmin } from './supabase/admin'
import { redirect } from 'next/navigation'

export { calculateGrade } from './grade'

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

/**
 * Tenant-admin gate. Superadmins bypass the per-school admin check —
 * they're implicitly admin of every school, so viewing any school's
 * admin pages works the same as if they were a native admin of that
 * tenant. No cookie, no banner, no impersonation state — just access.
 */
export async function requireAdmin() {
  const user = await requireUser()
  if (user.role === 'admin') return user

  // Not admin of their own tenant — check superadmin allowlist
  const { data: isSa } = await supabaseAdmin.rpc('is_superadmin_email', { p_email: user.email })
  if (isSa === true) return user

  redirect('/')
}
