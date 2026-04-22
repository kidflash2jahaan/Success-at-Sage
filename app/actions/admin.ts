'use server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug, type Tenant } from '@/lib/tenant'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email/resend'
import { revalidatePath } from 'next/cache'

/**
 * Resolve the tenant from the URL's schoolSlug and verify the caller is
 * authorized to admin it. Returns the tenant so the action can scope
 * mutations by `tenant.id` — not by the caller's own users.school_id.
 *
 * This is what makes superadmin-acting-in-Oakwood safe: the tenant
 * comes from the URL the admin is looking at, not from the row in
 * `users` belonging to the superadmin (which is Sage).
 */
async function gateAdmin(schoolSlug: string): Promise<Tenant> {
  const tenant = await resolveTenantBySlug(schoolSlug)
  await requireAdmin(tenant.id)
  return tenant
}

async function fetchMaterialWithUploader(materialId: string, schoolId: string) {
  // The tenant filter is defensive: the row's school_id is already
  // enforced to be non-null and composite FKs prevent cross-tenant
  // references, but an explicit check here costs nothing and keeps
  // the intent obvious.
  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id, title, uploaded_by')
    .eq('id', materialId)
    .eq('school_id', schoolId)
    .single()
  if (!material) return null
  const { data: uploader } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', material.uploaded_by)
    .single()
  return { material, uploader }
}

export async function approveMaterial(schoolSlug: string, materialId: string) {
  const tenant = await gateAdmin(schoolSlug)
  const result = await fetchMaterialWithUploader(materialId, tenant.id)
  if (!result) return
  await supabaseAdmin
    .from('materials')
    .update({ status: 'approved' })
    .eq('id', materialId)
    .eq('school_id', tenant.id)
  if (result.uploader) await sendApprovalEmail(result.uploader.email, result.material.title)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function rejectMaterial(schoolSlug: string, materialId: string, note: string) {
  const tenant = await gateAdmin(schoolSlug)
  const result = await fetchMaterialWithUploader(materialId, tenant.id)
  if (!result) return
  await supabaseAdmin
    .from('materials')
    .update({ status: 'rejected', rejection_note: note || null })
    .eq('id', materialId)
    .eq('school_id', tenant.id)
  if (result.uploader) await sendRejectionEmail(result.uploader.email, result.material.title, note)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function approveUnit(schoolSlug: string, unitId: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('units')
    .update({ status: 'approved' })
    .eq('id', unitId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function rejectUnit(schoolSlug: string, unitId: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('materials')
    .update({ status: 'rejected' })
    .eq('unit_id', unitId)
    .eq('status', 'pending')
    .eq('school_id', tenant.id)
  await supabaseAdmin
    .from('units')
    .delete()
    .eq('id', unitId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function deleteMaterial(schoolSlug: string, materialId: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function adminUpdatePendingUnitTitle(schoolSlug: string, unitId: string, title: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('units')
    .update({ title: title.trim() })
    .eq('id', unitId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function adminMoveMaterialToUnit(schoolSlug: string, materialId: string, newUnitId: string) {
  const tenant = await gateAdmin(schoolSlug)
  // Both rows must belong to this tenant; the FK/unique constraints
  // from migration 0004 would catch a cross-tenant attempt but this is
  // explicit and fails fast with a better error.
  await supabaseAdmin
    .from('materials')
    .update({ unit_id: newUnitId })
    .eq('id', materialId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
}

export async function adminCreateUnitAndMove(
  schoolSlug: string,
  materialId: string,
  courseId: string,
  unitTitle: string,
) {
  const tenant = await gateAdmin(schoolSlug)
  const { data: top } = await supabaseAdmin
    .from('units')
    .select('order_index')
    .eq('course_id', courseId)
    .eq('school_id', tenant.id)
    .eq('status', 'approved')
    .order('order_index', { ascending: false })
    .limit(1)
    .returns<{ order_index: number }[]>()
  const nextOrder = (top?.[0]?.order_index ?? 0) + 1
  const { data: newUnit } = await supabaseAdmin
    .from('units')
    .insert({ school_id: tenant.id, course_id: courseId, title: unitTitle.trim(), order_index: nextOrder, status: 'approved' })
    .select('id')
    .single<{ id: string }>()
  if (!newUnit) throw new Error('Could not create unit')
  await supabaseAdmin
    .from('materials')
    .update({ unit_id: newUnit.id })
    .eq('id', materialId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
}

export async function adminEditMaterial(
  schoolSlug: string,
  materialId: string,
  title: string,
  type: 'note' | 'test',
  contentText: string | null,
  linkUrl?: string,
  attachmentPaths?: string[],
) {
  const tenant = await gateAdmin(schoolSlug)
  const updates: Record<string, unknown> = {
    title: title.trim(),
    type,
    link_url: linkUrl?.trim() || null,
  }
  if (attachmentPaths !== undefined) updates.attachment_paths = attachmentPaths
  if (contentText !== null) updates.content_json = contentText.trim() ? { text: contentText.trim() } : null
  await supabaseAdmin
    .from('materials')
    .update(updates)
    .eq('id', materialId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/submissions', 'page')
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
}

export async function updateUserInfo(schoolSlug: string, userId: string, fullName: string, graduatingYear: number) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('users')
    .update({ full_name: fullName.trim(), graduating_year: graduatingYear })
    .eq('id', userId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/users', 'page')
}

export async function updateContestSettings(schoolSlug: string, nextResetDate: string, prizeDescription: string, periodStart: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('contest_settings')
    .update({ next_reset_date: nextResetDate, prize_description: prizeDescription, period_start: periodStart })
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/contest', 'page')
  revalidatePath('/s/[schoolSlug]/leaderboard', 'page')
}

export async function chooseContestWinner(schoolSlug: string, userId: string, periodLabel: string, periodStart: string, periodEnd: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin.from('contest_winners').insert({
    school_id: tenant.id,
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
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/contest', 'page')
  revalidatePath('/s/[schoolSlug]/leaderboard', 'page')
}

export async function markWinnerPaid(schoolSlug: string, winnerId: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('contest_winners')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', winnerId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/contest', 'page')
}

export async function promoteToAdmin(schoolSlug: string, userId: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('users')
    .update({ role: 'admin' })
    .eq('id', userId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/users', 'page')
}

export async function demoteToStudent(schoolSlug: string, userId: string) {
  const tenant = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('users')
    .update({ role: 'student' })
    .eq('id', userId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/users', 'page')
}
