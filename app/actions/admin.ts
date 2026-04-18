'use server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

async function fetchMaterialWithUploader(materialId: string) {
  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id, title, uploaded_by')
    .eq('id', materialId)
    .single()
  if (!material) return null
  const { data: uploader } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', material.uploaded_by)
    .single()
  return { material, uploader }
}

export async function approveMaterial(materialId: string) {
  await requireAdmin()
  const result = await fetchMaterialWithUploader(materialId)
  if (!result) return
  await supabaseAdmin.from('materials').update({ status: 'approved' }).eq('id', materialId)
  if (result.uploader) await sendApprovalEmail(result.uploader.email, result.material.title)
  revalidatePath('/admin/submissions')
}

export async function rejectMaterial(materialId: string, note: string) {
  await requireAdmin()
  const result = await fetchMaterialWithUploader(materialId)
  if (!result) return
  await supabaseAdmin
    .from('materials')
    .update({ status: 'rejected', rejection_note: note || null })
    .eq('id', materialId)
  if (result.uploader) await sendRejectionEmail(result.uploader.email, result.material.title, note)
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
  linkUrl?: string,
  attachmentPaths?: string[],
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
    link_url: linkUrl?.trim() || null,
    attachment_paths: attachmentPaths?.length ? attachmentPaths : [],
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
  const { data: unitData } = await supabaseAdmin
    .from('units').select('id, course_id, order_index').eq('id', unitId).single()
  const unit = unitData as { id: string; course_id: string; order_index: number } | null
  if (!unit) return
  const { data: siblingsData } = await supabaseAdmin
    .from('units').select('id, order_index')
    .eq('course_id', unit.course_id).eq('status', 'approved').order('order_index')
  const siblings = siblingsData as { id: string; order_index: number }[] | null
  if (!siblings) return
  const idx = siblings.findIndex(u => u.id === unitId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return
  const swap = siblings[swapIdx]
  await Promise.all([
    supabaseAdmin.from('units').update({ order_index: swap.order_index }).eq('id', unitId),
    supabaseAdmin.from('units').update({ order_index: unit.order_index }).eq('id', swap.id),
  ])
  revalidatePath('/admin/courses')
}

export async function updateUnitTitle(unitId: string, title: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').update({ title: title.trim() }).eq('id', unitId)
  revalidatePath('/admin/courses')
}

export async function adminUpdatePendingUnitTitle(unitId: string, title: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').update({ title: title.trim() }).eq('id', unitId)
  revalidatePath('/admin/submissions')
}

export async function adminMoveMaterialToUnit(materialId: string, newUnitId: string) {
  await requireAdmin()
  await supabaseAdmin.from('materials').update({ unit_id: newUnitId }).eq('id', materialId)
  revalidatePath('/admin/submissions')
}

export async function adminEditMaterial(materialId: string, title: string, type: 'note' | 'test', contentText: string | null, linkUrl?: string, attachmentPaths?: string[]) {
  await requireAdmin()
  const updates: Record<string, unknown> = {
    title: title.trim(),
    type,
    link_url: linkUrl?.trim() || null,
  }
  if (attachmentPaths !== undefined) updates.attachment_paths = attachmentPaths
  if (contentText !== null) updates.content_json = contentText.trim() ? { text: contentText.trim() } : null
  await supabaseAdmin.from('materials').update(updates).eq('id', materialId)
  revalidatePath('/admin/submissions')
  revalidatePath('/admin/courses')
}

export async function updateUserInfo(userId: string, fullName: string, graduatingYear: number) {
  await requireAdmin()
  await supabaseAdmin
    .from('users')
    .update({ full_name: fullName.trim(), graduating_year: graduatingYear })
    .eq('id', userId)
  revalidatePath('/admin/users')
}

export async function updateContestSettings(nextResetDate: string, prizeDescription: string, periodStart: string) {
  await requireAdmin()
  await supabaseAdmin
    .from('contest_settings')
    .update({ next_reset_date: nextResetDate, prize_description: prizeDescription, period_start: periodStart })
    .eq('id', 1)
  revalidatePath('/admin/contest')
  revalidatePath('/leaderboard')
}

export async function chooseContestWinner(userId: string, periodLabel: string, periodStart: string, periodEnd: string) {
  await requireAdmin()
  await supabaseAdmin.from('contest_winners').insert({
    user_id: userId,
    period_label: periodLabel,
    period_start: periodStart,
    period_end: periodEnd,
  })
  // Advance the period to next month's 1st
  const next = new Date(periodEnd + 'T00:00:00')
  next.setMonth(next.getMonth() + 1)
  next.setDate(1)
  const nextReset = next.toISOString().split('T')[0]
  await supabaseAdmin
    .from('contest_settings')
    .update({ period_start: periodEnd, next_reset_date: nextReset })
    .eq('id', 1)
  revalidatePath('/admin/contest')
  revalidatePath('/leaderboard')
}

export async function markWinnerPaid(winnerId: string) {
  await requireAdmin()
  await supabaseAdmin
    .from('contest_winners')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', winnerId)
  revalidatePath('/admin/contest')
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
