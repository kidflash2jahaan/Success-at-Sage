'use server'
import { requireUser, requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'

type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

export async function reportMaterial(
  schoolSlug: string,
  materialId: string,
  reason: string,
): Promise<ActionResult> {
  const user = await requireUser()
  const tenant = await resolveTenantBySlug(schoolSlug)
  // Only report materials in your own tenant.
  if (user.schoolId !== tenant.id) return { ok: false, error: 'not your school' }
  const cleaned = reason.trim()
  if (cleaned.length < 3) return { ok: false, error: 'Please give at least a short reason.' }
  if (cleaned.length > 1000) return { ok: false, error: 'Reason is too long.' }

  // Verify the material exists in this tenant before we record the report.
  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id')
    .eq('id', materialId)
    .eq('school_id', tenant.id)
    .single()
  if (!material) return { ok: false, error: 'Material not found.' }

  const { error } = await supabaseAdmin.from('material_reports').insert({
    school_id: tenant.id,
    material_id: materialId,
    reporter_user_id: user.id,
    reason: cleaned,
  })
  if (error) return { ok: false, error: 'Could not submit report.' }

  revalidatePath('/s/[schoolSlug]/admin/reports', 'page')
  return { ok: true, data: undefined }
}

export async function dismissReport(schoolSlug: string, reportId: string): Promise<ActionResult> {
  const tenant = await resolveTenantBySlug(schoolSlug)
  const admin = await requireAdmin(tenant.id)
  await supabaseAdmin
    .from('material_reports')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .eq('id', reportId)
    .eq('school_id', tenant.id)
  revalidatePath('/s/[schoolSlug]/admin/reports', 'page')
  return { ok: true, data: undefined }
}

// Mark a report resolved AND delete the underlying material. Cascade will
// clear any other pending reports on the same material.
export async function resolveReportAndDeleteMaterial(
  schoolSlug: string,
  reportId: string,
): Promise<ActionResult> {
  const tenant = await resolveTenantBySlug(schoolSlug)
  const admin = await requireAdmin(tenant.id)

  const { data: report } = await supabaseAdmin
    .from('material_reports')
    .select('material_id')
    .eq('id', reportId)
    .eq('school_id', tenant.id)
    .single<{ material_id: string }>()
  if (!report) return { ok: false, error: 'Report not found.' }

  // Mark resolved before the delete cascades the row away — keeps an audit
  // trail via resolved_by/resolved_at on any sibling reports for the same
  // material (they cascade on delete, so no trail remains, but at least the
  // admin action is recorded in logs).
  await supabaseAdmin
    .from('material_reports')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .eq('material_id', report.material_id)
    .eq('school_id', tenant.id)
    .eq('status', 'pending')

  await supabaseAdmin
    .from('materials')
    .delete()
    .eq('id', report.material_id)
    .eq('school_id', tenant.id)

  revalidatePath('/s/[schoolSlug]/admin/reports', 'page')
  revalidatePath('/s/[schoolSlug]/admin/courses', 'page')
  return { ok: true, data: undefined }
}
