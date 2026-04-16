'use server'
import { requireUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { materials } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
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
  await db.insert(materials).values({
    unitId: input.unitId,
    uploadedBy: user.id,
    title: input.title,
    type: input.type,
    contentType: input.contentType,
    pdfPath: input.pdfPath ?? null,
    contentJson: input.contentJson ?? null,
    status: 'pending',
  })
  revalidatePath('/profile')
}

export async function incrementViewCount(materialId: string) {
  await requireUser()
  await db.update(materials)
    .set({ viewCount: sql`${materials.viewCount} + 1` })
    .where(eq(materials.id, materialId))
}
