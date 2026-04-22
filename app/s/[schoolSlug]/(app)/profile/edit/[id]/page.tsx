export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import EditMaterialForm from '@/components/profile/EditMaterialForm'

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; id: string }>
}) {
  const user = await requireUser()
  const { schoolSlug, id } = await params

  const { data: material } = await supabaseAdmin
    .from('materials')
    .select('id, title, type, content_type, content_json, pdf_path, link_url, attachment_paths, unit_id, uploaded_by, units(title, courses(name))')
    .eq('id', id)
    .single()

  if (!material) notFound()
  if ((material as any).uploaded_by !== user.id) redirect(`/s/${schoolSlug}/profile`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <EditMaterialForm
        schoolSlug={schoolSlug}
        id={(material as any).id}
        unitId={(material as any).unit_id}
        initialTitle={(material as any).title}
        initialContentType={(material as any).content_type === 'pdf' ? 'pdf' : 'richtext'}
        initialContent={((material as any).content_json as { text?: string } | null)?.text ?? ''}
        initialAttachmentPaths={(material as any).attachment_paths ?? []}
        initialPdfPath={(material as any).pdf_path ?? null}
        unitTitle={(material as any).units?.title ?? ''}
        courseName={(material as any).units?.courses?.name ?? ''}
      />
    </div>
  )
}
