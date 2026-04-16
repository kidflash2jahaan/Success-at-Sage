export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import EditMaterialForm from '@/components/profile/EditMaterialForm'

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id, title, content_json, link_url, attachment_path, unit_id, uploaded_by, units(title, courses(name))')
    .eq('id', id)
    .single()

  if (!material) notFound()
  if ((material as any).uploaded_by !== user.id) redirect('/profile')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <EditMaterialForm
        id={(material as any).id}
        unitId={(material as any).unit_id}
        initialTitle={(material as any).title}
        initialContent={((material as any).content_json as { text?: string } | null)?.text ?? ''}
        initialLinkUrl={(material as any).link_url ?? ''}
        hasAttachment={!!(material as any).attachment_path}
        unitTitle={(material as any).units?.title ?? ''}
        courseName={(material as any).units?.courses?.name ?? ''}
      />
    </div>
  )
}
