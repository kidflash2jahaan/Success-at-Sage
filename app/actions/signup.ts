'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantByEmail, resolveTenantBySlug } from '@/lib/tenant'
import { redirect } from 'next/navigation'

/**
 * Multi-tenant signup:
 *   1. email domain → Tenant lookup via school_domains
 *   2. if no tenant → redirect to /request-school so the user can submit a
 *      request-to-create with their email pre-filled
 *   3. if tenant found → sign up, create users row under that tenant, route
 *      to /s/<slug>/onboarding
 *
 * ADMIN_EMAILS allowlist still bypasses the domain check and creates the
 * user under Sage (superadmin lives there). Superadmin status itself
 * comes from the JWT hook, not from this function.
 */
export async function signUpWithEmail(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const graduatingYear = parseInt(formData.get('graduatingYear') as string)

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const isSuperadmin = adminEmails.includes(email)

  let tenant = await resolveTenantByEmail(email)
  if (!tenant && isSuperadmin) {
    // Superadmin signup without a matching school → land in Sage
    tenant = await resolveTenantBySlug('sage')
  }
  if (!tenant) {
    redirect(`/request-school?email=${encodeURIComponent(email)}`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) redirect('/signup?error=taken')

  const role = isSuperadmin ? 'admin' as const : 'student' as const

  await supabaseAdmin.from('users').insert({
    id: data.user.id,
    school_id: tenant.id,
    email,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  })

  redirect(`/s/${tenant.slug}/onboarding`)
}
