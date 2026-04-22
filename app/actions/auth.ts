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
  const role: 'student' | 'admin' = isSuperadmin ? 'admin' : 'student'

  // Resolve tenant by email domain. If nothing matches, there's no
  // school to attach the user to — bounce them to /request-school.
  const tenant = await resolveTenantByEmail(email)
  if (!tenant) redirect(`/request-school?email=${encodeURIComponent(email)}`)

  // Upsert users row under the resolved tenant.
  await supabaseAdmin.from('users').upsert({
    id: authUser.id,
    school_id: tenant.id,
    email,
    full_name: fullName,
    graduating_year: graduatingYear,
    role,
  }, { onConflict: 'id' })

  // If this user is a pending school admin (their school was just approved
  // by superadmin), promote them and switch their school_id to the approved
  // school. This overrides the email-domain tenant resolution above.
  const { data: promotedSchoolId } = await supabaseAdmin.rpc(
    'promote_pending_school_admin' as never,
    { p_user_id: authUser.id, p_email: email },
  )
  if (promotedSchoolId) {
    const { data: promotedSchool } = await supabaseAdmin
      .from('schools')
      .select('slug')
      .eq('id', promotedSchoolId)
      .single<{ slug: string }>()
    const promotedTenant = promotedSchool
      ? await resolveTenantBySlug(promotedSchool.slug).catch(() => tenant)
      : tenant
    redirect(`/s/${promotedTenant.slug}/dashboard`)
  }

  redirect(`/s/${tenant.slug}/dashboard`)
}
