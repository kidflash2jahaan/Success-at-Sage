'use server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserSchoolId } from '@/lib/tenant-for-user'
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
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
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
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function approveUnit(unitId: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').update({ status: 'approved' }).eq('id', unitId)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function rejectUnit(unitId: string) {
  await requireAdmin()
  // Reject the unit and any pending materials attached to it
  await supabaseAdmin.from('materials').update({ status: 'rejected' }).eq('unit_id', unitId).eq('status', 'pending')
  await supabaseAdmin.from('units').delete().eq('id', unitId)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function deleteMaterial(materialId: string) {
  await requireAdmin()
  await supabaseAdmin.from('materials').delete().eq('id', materialId)
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function adminUpdatePendingUnitTitle(unitId: string, title: string) {
  await requireAdmin()
  await supabaseAdmin.from('units').update({ title: title.trim() }).eq('id', unitId)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function adminMoveMaterialToUnit(materialId: string, newUnitId: string) {
  await requireAdmin()
  await supabaseAdmin.from('materials').update({ unit_id: newUnitId }).eq('id', materialId)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function adminCreateUnitAndMove(materialId: string, courseId: string, unitTitle: string) {
  const user = await requireAdmin()
  const schoolId = await getUserSchoolId(user.id)
  const { data: top } = await supabaseAdmin
    .from('units')
    .select('order_index')
    .eq('course_id', courseId)
    .eq('status', 'approved')
    .order('order_index', { ascending: false })
    .limit(1)
  const nextOrder = ((top?.[0] as any)?.order_index ?? 0) + 1
  const { data: newUnit } = await supabaseAdmin
    .from('units')
    .insert({ school_id: schoolId, course_id: courseId, title: unitTitle.trim(), order_index: nextOrder, status: 'approved' })
    .select('id')
    .single()
  if (!newUnit) throw new Error('Could not create unit')
  await supabaseAdmin.from('materials').update({ unit_id: (newUnit as any).id }).eq('id', materialId)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
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
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
}

export async function updateUserInfo(userId: string, fullName: string, graduatingYear: number) {
  await requireAdmin()
  await supabaseAdmin
    .from('users')
    .update({ full_name: fullName.trim(), graduating_year: graduatingYear })
    .eq('id', userId)
  revalidatePath('/s/[schoolSlug]/admin/users', 'page')
}

export async function updateContestSettings(nextResetDate: string, prizeDescription: string, periodStart: string) {
  const user = await requireAdmin()
  const schoolId = await getUserSchoolId(user.id)
  await supabaseAdmin
    .from('contest_settings')
    .update({ next_reset_date: nextResetDate, prize_description: prizeDescription, period_start: periodStart })
    .eq('school_id', schoolId)
  revalidatePath('/s/[schoolSlug]/admin/contest', 'page')
  revalidatePath('/s/[schoolSlug]/leaderboard', 'page')
}

export async function chooseContestWinner(userId: string, periodLabel: string, periodStart: string, periodEnd: string) {
  const admin = await requireAdmin()
  const schoolId = await getUserSchoolId(admin.id)
  await supabaseAdmin.from('contest_winners').insert({
    school_id: schoolId,
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
    .eq('school_id', schoolId)
  revalidatePath('/s/[schoolSlug]/admin/contest', 'page')
  revalidatePath('/s/[schoolSlug]/leaderboard', 'page')
}

export async function markWinnerPaid(winnerId: string) {
  await requireAdmin()
  await supabaseAdmin
    .from('contest_winners')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', winnerId)
  revalidatePath('/s/[schoolSlug]/admin/contest', 'page')
}

export async function promoteToAdmin(userId: string) {
  await requireAdmin()
  await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', userId)
  revalidatePath('/s/[schoolSlug]/admin/users', 'page')
}

export async function demoteToStudent(userId: string) {
  await requireAdmin()
  await supabaseAdmin.from('users').update({ role: 'student' }).eq('id', userId)
  revalidatePath('/s/[schoolSlug]/admin/users', 'page')
}
