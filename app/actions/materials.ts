'use server'
import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SAGE_SCHOOL_ID } from '@/lib/constants'
import { sendAdminSubmissionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

// Server actions throw errors get redacted on the client in production, so the
// user sees a generic "an error occurred". Return a typed result object instead
// so callers can render the real message.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

async function getAdminEmails(): Promise<string[]> {
  const { data } = await supabaseAdmin.from('users').select('email').eq('role', 'admin')
  return (data ?? []).map((u: any) => u.email as string)
}

export async function submitNewUnit(
  courseId: string,
  title: string,
): Promise<ActionResult<{ unitId: string }>> {
  const user = await requireUser()
  if (!title.trim()) return { ok: false, error: 'Unit title is required.' }
  const { data, error } = await supabaseAdmin
    .from('units')
    .insert({ school_id: SAGE_SCHOOL_ID, course_id: courseId, title: title.trim(), order_index: 9999, status: 'pending', submitted_by: user.id })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: 'Could not create unit. Please try again.' }
  revalidatePath('/admin/submissions')
  return { ok: true, data: { unitId: (data as any).id as string } }
}

export async function submitMaterial(input: {
  unitId: string
  title: string
  type: 'note' | 'test'
  contentType: 'richtext' | 'pdf'
  contentText: string
  pdfPath?: string
  linkUrl?: string
  attachmentPaths?: string[]
}): Promise<ActionResult> {
  const user = await requireUser()

  const cleanTitle = input.title.trim()
  if (!cleanTitle) return { ok: false, error: 'Title is required.' }

  const { data: existing } = await supabaseAdmin
    .from('materials')
    .select('id')
    .eq('unit_id', input.unitId)
    .ilike('title', cleanTitle)
    .neq('status', 'rejected')
    .maybeSingle()
  if (existing) return { ok: false, error: 'A submission with that title already exists in this unit.' }

  const { error: insertError } = await supabaseAdmin.from('materials').insert({
    school_id: SAGE_SCHOOL_ID,
    unit_id: input.unitId,
    uploaded_by: user.id,
    title: cleanTitle,
    type: input.type,
    content_type: input.contentType,
    pdf_path: input.pdfPath ?? null,
    content_json: input.contentType === 'richtext' && input.contentText.trim() ? { text: input.contentText.trim() } : null,
    link_url: input.contentType === 'richtext' ? (input.linkUrl?.trim() || null) : null,
    attachment_paths: input.contentType === 'richtext' && input.attachmentPaths?.length ? input.attachmentPaths : [],
    status: 'pending',
  })
  if (insertError) return { ok: false, error: 'Could not save your submission. Please try again.' }

  // Fire-and-forget — don't block submission on email delivery
  ;(async () => {
    try {
      const [{ data: unit }, adminEmails] = await Promise.all([
        supabaseAdmin.from('units').select('title, courses(name)').eq('id', input.unitId).single(),
        getAdminEmails(),
      ])
      await sendAdminSubmissionEmail(
        adminEmails,
        user.fullName,
        cleanTitle,
        input.type,
        (unit as any)?.courses?.name ?? '',
        (unit as any)?.title ?? '',
      )
    } catch {}
  })()

  revalidatePath('/profile')
  return { ok: true, data: undefined }
}

export async function editMaterial(
  materialId: string,
  title: string,
  type: 'note' | 'test',
  contentType: 'richtext' | 'pdf',
  contentText: string | null,
  pdfPath?: string | null,
  linkUrl?: string,
  attachmentPaths?: string[] | null,
): Promise<ActionResult> {
  const user = await requireUser()
  const cleanTitle = title.trim()
  if (!cleanTitle) return { ok: false, error: 'Title is required.' }

  const { data: material } = await supabaseAdmin
    .from('materials').select('id, uploaded_by, status').eq('id', materialId).single()
  if (!material || (material as any).uploaded_by !== user.id) {
    return { ok: false, error: 'You can only edit your own submissions.' }
  }

  const updates: Record<string, unknown> = {
    title: cleanTitle,
    type,
    content_type: contentType,
    status: 'pending',
    rejection_note: null,
  }
  if (contentType === 'pdf') {
    if (pdfPath !== undefined) updates.pdf_path = pdfPath
    updates.link_url = null
    updates.attachment_paths = []
    updates.content_json = null
  } else {
    updates.pdf_path = null
    updates.link_url = linkUrl?.trim() || null
    if (attachmentPaths !== undefined) updates.attachment_paths = attachmentPaths ?? []
    if (contentText !== null) updates.content_json = contentText.trim() ? { text: contentText.trim() } : null
  }
  const { error } = await supabaseAdmin.from('materials').update(updates).eq('id', materialId)
  if (error) return { ok: false, error: 'Could not save changes. Please try again.' }
  revalidatePath('/profile')
  return { ok: true, data: undefined }
}

export async function incrementViewCount(materialId: string): Promise<boolean> {
  // The RPC takes user_id explicitly because we call it via the service-role
  // client, where auth.uid() is NULL. Pass the authenticated user's id so
  // material_views.user_id isn't null and the row can actually insert.
  const user = await requireUser()
  const { data } = await supabaseAdmin.rpc('increment_view_count', {
    p_material_id: materialId,
    p_user_id: user.id,
  })
  return data === true
}
