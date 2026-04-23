'use server'
import { requireUser, gateAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import { type ActionResult } from '@/app/actions/materials'
import { revalidatePath } from 'next/cache'

const ADMIN_REPORTS_PATH = '/s/[schoolSlug]/admin/reports'
const ADMIN_COURSES_PATH = '/s/[schoolSlug]/admin/courses'

export async function reportMaterial(
  schoolSlug: string,
  materialId: string,
  reason: string,
): Promise<ActionResult> {
  const user = await requireUser()
  const tenant = await resolveTenantBySlug(schoolSlug)
  if (user.schoolId !== tenant.id) return { ok: false, error: 'not your school' }

  const cleaned = reason.trim()
  if (cleaned.length < 3) return { ok: false, error: 'Please give at least a short reason.' }
  if (cleaned.length > 1000) return { ok: false, error: 'Reason is too long.' }

  // FK on material_id + same-tenant school_id on insert is authoritative; no
  // upfront SELECT. PG error 23503 = foreign_key_violation.
  const { error } = await supabaseAdmin.from('material_reports').insert({
    school_id: tenant.id,
    material_id: materialId,
    reporter_user_id: user.id,
    reason: cleaned,
  })
  if (error?.code === '23503') return { ok: false, error: 'Material not found.' }
  if (error) return { ok: false, error: 'Could not submit report.' }

  revalidatePath(ADMIN_REPORTS_PATH, 'page')
  return { ok: true, data: undefined }
}

export async function dismissReport(schoolSlug: string, reportId: string): Promise<ActionResult> {
  const { tenant, admin } = await gateAdmin(schoolSlug)
  await supabaseAdmin
    .from('material_reports')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: admin.id })
    .eq('id', reportId)
    .eq('school_id', tenant.id)
  revalidatePath(ADMIN_REPORTS_PATH, 'page')
  return { ok: true, data: undefined }
}

// Deleting the material cascades any sibling reports away — no separate
// audit-trail update needed (the rows themselves disappear).
export async function resolveReportAndDeleteMaterial(
  schoolSlug: string,
  reportId: string,
): Promise<ActionResult> {
  const { tenant } = await gateAdmin(schoolSlug)

  const { data: report } = await supabaseAdmin
    .from('material_reports')
    .select('material_id')
    .eq('id', reportId)
    .eq('school_id', tenant.id)
    .single<{ material_id: string }>()
  if (!report) return { ok: false, error: 'Report not found.' }

  await supabaseAdmin
    .from('materials')
    .delete()
    .eq('id', report.material_id)
    .eq('school_id', tenant.id)

  revalidatePath(ADMIN_REPORTS_PATH, 'page')
  revalidatePath(ADMIN_COURSES_PATH, 'page')
  return { ok: true, data: undefined }
}
