'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/superadmin'
import { getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/** Approve a school request. Creates the school + domains, flags the requester as pending-admin. */
export async function approveSchoolRequest(requestId: string) {
  await requireSuperadmin()
  const authUser = await getUser()

  // Read the request
  const { data: req, error: reqErr } = await supabaseAdmin
    .from('school_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  if (reqErr || !req) throw new Error('Request not found')
  if ((req as any).status !== 'pending') throw new Error(`Request already ${(req as any).status}`)

  // Create the school
  const { data: school, error: schoolErr } = await supabaseAdmin
    .from('schools')
    .insert({
      slug: (req as any).proposed_slug,
      name: (req as any).proposed_name,
      display_short: (req as any).proposed_display_short,
      contest_enabled: false,
    })
    .select('id, slug')
    .single()
  if (schoolErr || !school) throw new Error(`Could not create school: ${schoolErr?.message ?? 'unknown'}`)

  // Insert domains (skip duplicates — global UNIQUE)
  const domains = ((req as any).proposed_domains as string[]) ?? []
  if (domains.length > 0) {
    const rows = domains.map(d => ({ school_id: (school as any).id, domain: d.toLowerCase() }))
    await supabaseAdmin.from('school_domains').insert(rows)
  }

  // Flag the requester's email as pending school admin
  // (plain SQL since private.pending_school_admins isn't exposed via PostgREST)
  await supabaseAdmin.rpc('mark_pending_school_admin' as any, {
    p_email: ((req as any).requester_email as string).toLowerCase(),
    p_school_id: (school as any).id,
  })

  // Mark the request approved
  await supabaseAdmin
    .from('school_requests')
    .update({
      status: 'approved',
      reviewed_by: authUser?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  revalidatePath('/admin/schools')
  revalidatePath(`/admin/schools/${requestId}`)
  redirect('/admin/schools?approved=1')
}

/** Reject a school request with a note. */
export async function rejectSchoolRequest(requestId: string, note: string) {
  await requireSuperadmin()
  const authUser = await getUser()

  await supabaseAdmin
    .from('school_requests')
    .update({
      status: 'rejected',
      review_note: note || null,
      reviewed_by: authUser?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  revalidatePath('/admin/schools')
  revalidatePath(`/admin/schools/${requestId}`)
  redirect('/admin/schools?rejected=1')
}

/** Enter impersonation mode: sets a cookie and redirects to the tenant. */
export async function startImpersonating(slug: string) {
  await requireSuperadmin()
  const c = await cookies()
  c.set('impersonating_school', slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 4, // 4 hours
  })
  redirect(`/s/${slug}/dashboard`)
}

/** Exit impersonation. */
export async function stopImpersonating() {
  const c = await cookies()
  c.delete('impersonating_school')
  redirect('/admin/schools')
}
