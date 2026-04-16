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
