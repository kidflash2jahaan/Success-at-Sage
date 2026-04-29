'use server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantByEmail } from '@/lib/tenant'
import { deriveGraduatingYearFromEmail } from '@/lib/grade'
import { redirect } from 'next/navigation'

/**
 * Multi-tenant signup:
 *   1. email domain → Tenant lookup via school_domains
 *   2. if no tenant → redirect to /request-school so the user can submit a
 *      request-to-create with their email pre-filled
 *   3. if tenant found → sign up, create users row under that tenant, route
 *      to /s/<slug>/onboarding
 *
 * Superadmin status is granted by the JWT hook from the ADMIN_EMAILS
 * allowlist; it doesn't influence where the users row lives. A superadmin
 * without a matching domain is sent to /request-school just like anyone
 * else — no silent fallback to Sage.
 */
export async function signUpWithEmail(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  // Graduating year is auto-derived from the school's email convention:
  // first two digits → class of 20NN. Faculty / staff / non-conforming
  // emails fall through to UNKNOWN_GRADUATING_YEAR ("Other").
  const graduatingYear = deriveGraduatingYearFromEmail(email)

  const tenant = await resolveTenantByEmail(email)
  if (!tenant) {
    redirect(`/request-school?email=${encodeURIComponent(email)}`)
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) redirect('/signup?error=taken')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase())
  const role = adminEmails.includes(email) ? 'admin' as const : 'student' as const

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
