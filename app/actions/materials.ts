'use server'
import { requireUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendAdminSubmissionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

const PENDING_LIMIT = 3

async function getPendingCount(userId: string, excludeId?: string) {
  let query = supabaseAdmin
    .from('materials')
    .select('id', { count: 'exact', head: true })
    .eq('uploaded_by', userId)
    .eq('status', 'pending')
  if (excludeId) query = query.neq('id', excludeId)
  const { count } = await query
  return count ?? 0
}

async function getAdminEmails(): Promise<string[]> {
  const { data } = await supabaseAdmin.from('users').select('email').eq('role', 'admin')
  return (data ?? []).map((u: any) => u.email as string)
}

export async function getSignedAttachmentUploadUrl(fileName: string, unitId: string) {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const path = `attachments/${user.id}/${unitId}/${Date.now()}-${fileName}`
  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUploadUrl(path)
  if (error || !data) throw new Error('Could not create upload URL')
  return { signedUrl: data.signedUrl, path }
}

export async function submitNewUnit(courseId: string, title: string): Promise<string> {
  const user = await requireUser()
  const { data, error } = await supabaseAdmin
    .from('units')
    .insert({ course_id: courseId, title: title.trim(), order_index: 9999, status: 'pending', submitted_by: user.id })
    .select('id')
    .single()
  if (error || !data) throw new Error('Could not create unit')
  revalidatePath('/admin/submissions')
  return (data as any).id as string
}

export async function submitMaterial(input: {
  unitId: string
  title: string
  type: 'note' | 'test'
  contentText: string
  linkUrl?: string
  attachmentPaths?: string[]
}) {
  const user = await requireUser()

  const pending = await getPendingCount(user.id)
  if (pending >= PENDING_LIMIT)
    throw new Error(`You already have ${PENDING_LIMIT} submissions pending review. Wait for those to be reviewed before submitting more.`)

  const { error: insertError } = await supabaseAdmin.from('materials').insert({
    unit_id: input.unitId,
    uploaded_by: user.id,
    title: input.title,
    type: input.type,
    content_type: 'richtext',
    pdf_path: null,
    content_json: input.contentText.trim() ? { text: input.contentText.trim() } : null,
    link_url: input.linkUrl?.trim() || null,
    attachment_paths: input.attachmentPaths?.length ? input.attachmentPaths : [],
    status: 'pending',
  })
  if (insertError) throw new Error(insertError.message)

  // Fire-and-forget — don't block submission on email delivery
  ;(async () => {
    try {
      const { data: unit } = await supabaseAdmin
        .from('units').select('title, courses(name)').eq('id', input.unitId).single()
      const adminEmails = await getAdminEmails()
      await sendAdminSubmissionEmail(
        adminEmails,
        user.fullName,
        input.title,
        input.type,
        (unit as any)?.courses?.name ?? '',
        (unit as any)?.title ?? '',
      )
    } catch {}
  })()

  revalidatePath('/profile')
}

export async function editMaterial(materialId: string, title: string, contentText: string | null, linkUrl?: string, attachmentPaths?: string[] | null) {
  const user = await requireUser()
  const { data: material } = await supabaseAdmin
    .from('materials').select('id, uploaded_by, status').eq('id', materialId).single()
  if (!material || (material as any).uploaded_by !== user.id) throw new Error('Not authorized')

  if ((material as any).status !== 'pending') {
    const pending = await getPendingCount(user.id)
    if (pending >= PENDING_LIMIT)
      throw new Error(`You already have ${PENDING_LIMIT} submissions pending review. Wait for those to be reviewed before resubmitting.`)
  }

  const updates: Record<string, unknown> = {
    title: title.trim(),
    status: 'pending',
    rejection_note: null,
    link_url: linkUrl?.trim() || null,
  }
  if (attachmentPaths !== undefined) updates.attachment_paths = attachmentPaths ?? []
  if (contentText !== null)
    updates.content_json = contentText.trim() ? { text: contentText.trim() } : null
  await supabaseAdmin.from('materials').update(updates).eq('id', materialId)
  revalidatePath('/profile')
}

export async function incrementViewCount(materialId: string) {
  await requireUser()
  await supabaseAdmin.rpc('increment_view_count', { material_id: materialId })
}
