'use server'
import { requireUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getSignedUploadUrl(fileName: string, unitId: string) {
  const user = await requireUser()
  const supabase = await createSupabaseServerClient()
  const path = `${user.id}/${unitId}/${Date.now()}-${fileName}`
  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUploadUrl(path)
  if (error || !data) throw new Error('Could not create upload URL')
  return { signedUrl: data.signedUrl, path }
}

export async function submitMaterial(input: {
  unitId: string
  title: string
  type: 'note' | 'test'
  contentType: 'pdf' | 'richtext'
  pdfPath?: string
  contentJson?: object
}) {
  const user = await requireUser()
  await supabaseAdmin.from('materials').insert({
    unit_id: input.unitId,
    uploaded_by: user.id,
    title: input.title,
    type: input.type,
    content_type: input.contentType,
    pdf_path: input.pdfPath ?? null,
    content_json: input.contentJson ?? null,
    status: 'pending',
  })
  revalidatePath('/profile')
}

export async function incrementViewCount(materialId: string) {
  await requireUser()
  await supabaseAdmin.rpc('increment_view_count', { material_id: materialId })
}
