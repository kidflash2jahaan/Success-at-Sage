'use server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

export async function approveMaterial(materialId: string) {
  await requireAdmin()
  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id, title, uploaded_by')
    .eq('id', materialId)
    .single()
  if (!material) return
  await supabaseAdmin.from('materials').update({ status: 'approved' }).eq('id', materialId)
  const { data: uploader } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', material.uploaded_by)
    .single()
  if (uploader) await sendApprovalEmail(uploader.email, material.title)
  revalidatePath('/admin/submissions')
}

export async function rejectMaterial(materialId: string, note: string) {
  await requireAdmin()
  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id, title, uploaded_by')
    .eq('id', materialId)
    .single()
  if (!material) return
  await supabaseAdmin
    .from('materials')
    .update({ status: 'rejected', rejection_note: note || null })
    .eq('id', materialId)
  const { data: uploader } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', material.uploaded_by)
    .single()
  if (uploader) await sendRejectionEmail(uploader.email, material.title, note)
  revalidatePath('/admin/submissions')
}

export async function createUnit(courseId: string, title: string, orderIndex: number) {
  await requireAdmin()
  await supabaseAdmin.from('units').insert({ course_id: courseId, title, order_index: orderIndex })
  revalidatePath('/admin/courses')
}

export async function deleteUnit(unitId: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').delete().eq('id', unitId)
  revalidatePath('/admin/courses')
}

export async function approveUnit(unitId: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').update({ status: 'approved' }).eq('id', unitId)
  revalidatePath('/admin/submissions')
}

export async function rejectUnit(unitId: string) {
  await requireAdmin()
  // Reject the unit and any pending materials attached to it
  await supabaseAdmin.from('materials').update({ status: 'rejected' }).eq('unit_id', unitId).eq('status', 'pending')
  await supabaseAdmin.from('units').delete().eq('id', unitId)
  revalidatePath('/admin/submissions')
}

export async function createAdminMaterial(
  unitId: string,
  title: string,
  type: 'note' | 'test',
  contentText: string,
) {
  const admin = await requireAdmin()
  await supabaseAdmin.from('materials').insert({
    unit_id: unitId,
    uploaded_by: admin.id,
    title: title.trim(),
    type,
    content_type: 'richtext',
    content_json: contentText.trim() ? { text: contentText.trim() } : null,
    pdf_path: null,
    status: 'approved',
  })
  revalidatePath('/admin/courses')
}

export async function deleteMaterial(materialId: string) {
  await requireAdmin()
  await supabaseAdmin.from('materials').delete().eq('id', materialId)
  revalidatePath('/admin/courses')
  revalidatePath('/admin/submissions')
}

export async function moveUnit(unitId: string, direction: 'up' | 'down') {
  await requireAdmin()
  const { data: unit } = await supabaseAdmin
    .from('units').select('id, course_id, order_index').eq('id', unitId).single()
  if (!unit) return
  const { data: siblings } = await supabaseAdmin
    .from('units').select('id, order_index')
    .eq('course_id', (unit as any).course_id).eq('status', 'approved').order('order_index')
  if (!siblings) return
  const idx = (siblings as any[]).findIndex(u => u.id === unitId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return
  const swap = (siblings as any[])[swapIdx]
  await Promise.all([
    supabaseAdmin.from('units').update({ order_index: swap.order_index }).eq('id', unitId),
    supabaseAdmin.from('units').update({ order_index: (unit as any).order_index }).eq('id', swap.id),
  ])
  revalidatePath('/admin/courses')
}

export async function updateUnitTitle(unitId: string, title: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').update({ title: title.trim() }).eq('id', unitId)
  revalidatePath('/admin/courses')
}

export async function adminEditMaterial(materialId: string, title: string, contentText: string | null) {
  await requireAdmin()
  const updates: Record<string, unknown> = { title: title.trim() }
  if (contentText !== null) updates.content_json = contentText.trim() ? { text: contentText.trim() } : null
  await supabaseAdmin.from('materials').update(updates).eq('id', materialId)
  revalidatePath('/admin/submissions')
}

export async function promoteToAdmin(userId: string) {
  await requireAdmin()
  await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function demoteToStudent(userId: string) {
  await requireAdmin()
  await supabaseAdmin.from('users').update({ role: 'student' }).eq('id', userId)
  revalidatePath('/admin/users')
}
