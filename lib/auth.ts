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
    schoolId: data.school_id as string,
    createdAt: data.created_at as string,
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Tenant-admin gate.
 *
 * - Superadmins (email in private.superadmin_emails) pass unconditionally.
 *   They implicitly have admin rights in every school.
 * - Regular admins (role='admin' on public.users) pass only for their
 *   OWN school. If a tenant_school_id is provided and it doesn't match
 *   their users.school_id, they're redirected — prevents cross-tenant
 *   admin access (a Sage admin can't manage Oakwood).
 * - Anyone else redirects to /.
 */
export async function requireAdmin(tenantSchoolId?: string) {
  const user = await requireUser()

  const { data: isSa } = await supabaseAdmin.rpc('is_superadmin_email', { p_email: user.email })
  if (isSa === true) return user

  if (user.role !== 'admin') redirect('/')
  if (tenantSchoolId && user.schoolId !== tenantSchoolId) redirect('/')

  return user
}
