'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSuperadmin } from '@/lib/superadmin'
import { getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type SchoolRequestRow = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  proposed_slug: string
  proposed_name: string
  proposed_display_short: string
  proposed_domains: string[] | null
  requester_email: string
}

/** Approve a school request. Creates the school + domains, flags the requester as pending-admin. */
export async function approveSchoolRequest(requestId: string) {
  await requireSuperadmin()
  const authUser = await getUser()

  const { data: req, error: reqErr } = await supabaseAdmin
    .from('school_requests')
    .select('*')
    .eq('id', requestId)
    .single<SchoolRequestRow>()
  if (reqErr || !req) throw new Error('Request not found')
  if (req.status !== 'pending') throw new Error(`Request already ${req.status}`)

  const { data: school, error: schoolErr } = await supabaseAdmin
    .from('schools')
    .insert({
      slug: req.proposed_slug,
      name: req.proposed_name,
      display_short: req.proposed_display_short,
      prize_enabled: false,
    })
    .select('id, slug')
    .single<{ id: string; slug: string }>()
  if (schoolErr || !school) throw new Error(`Could not create school: ${schoolErr?.message ?? 'unknown'}`)

  const domains = req.proposed_domains ?? []
  if (domains.length > 0) {
    const rows = domains.map(d => ({ school_id: school.id, domain: d.toLowerCase() }))
    await supabaseAdmin.from('school_domains').insert(rows)
  }

  await supabaseAdmin.rpc('mark_pending_school_admin' as never, {
    p_email: req.requester_email.toLowerCase(),
    p_school_id: school.id,
  })

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
