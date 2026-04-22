'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/**
 * Public form at /request-school. Anyone can submit a request for a new
 * school to be added. Superadmin reviews it at /admin/schools.
 *
 * No RLS bypass needed — Phase 2 RLS permits anonymous INSERT on
 * school_requests (policy: school_requests_public_insert).
 */
export async function requestSchool(formData: FormData) {
  const email = ((formData.get('requester_email') as string) ?? '').trim().toLowerCase()
  const slug = ((formData.get('proposed_slug') as string) ?? '').trim().toLowerCase()
  const name = ((formData.get('proposed_name') as string) ?? '').trim()
  const displayShort = ((formData.get('proposed_display_short') as string) ?? '').trim()
  const domainsRaw = (formData.get('proposed_domains') as string) ?? ''
  const domains = domainsRaw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
  const requesterName = ((formData.get('requester_name') as string) ?? '').trim()
  const requesterRole = ((formData.get('requester_role') as string) ?? '').trim() || null
  const notes = ((formData.get('notes') as string) ?? '').trim() || null

  if (!email || !slug || !name || !displayShort || domains.length === 0 || !requesterName) {
    redirect('/request-school?error=missing')
  }

  const { error } = await supabaseAdmin.from('school_requests').insert({
    proposed_slug: slug,
    proposed_name: name,
    proposed_display_short: displayShort,
    proposed_domains: domains,
    requester_name: requesterName,
    requester_email: email,
    requester_role: requesterRole,
    notes,
  })
  if (error) redirect('/request-school?error=1')
  redirect('/request-school/thanks')
}
