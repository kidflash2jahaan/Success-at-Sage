'use server'
import { getUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantByEmail, resolveTenantBySlug } from '@/lib/tenant'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const authUser = await getUser()
  if (!authUser) redirect('/login')

  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)
  const email = (authUser.email ?? '').trim().toLowerCase()

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const isSuperadmin = adminEmails.includes(email)
  const role = isSuperadmin ? 'admin' as const : 'student' as const

  // Tenant resolution: email domain → Tenant; superadmin falls back to Sage.
  let tenant = await resolveTenantByEmail(email)
  if (!tenant && isSuperadmin) tenant = await resolveTenantBySlug('sage')
  if (!tenant) redirect(`/request-school?email=${encodeURIComponent(email)}`)

  // Use upsert so this is idempotent — /signup eagerly creates the user row
  // for email+password signups, but the /auth/callback path routes through
  // /onboarding when no row exists yet. A race (or repeat submit) shouldn't
  // crash on a primary-key conflict.
  await supabaseAdmin.from('users').upsert({
    id: authUser.id,
    school_id: tenant.id,
    email,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  }, { onConflict: 'id' })

  redirect(`/s/${tenant.slug}/dashboard`)
}
