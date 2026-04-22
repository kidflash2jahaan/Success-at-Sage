export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import EditMaterialForm from '@/components/profile/EditMaterialForm'

type MaterialWithUnit = {
  id: string
  title: string
  type: 'note' | 'test'
  content_type: 'pdf' | 'richtext'
  content_json: { text?: string } | null
  pdf_path: string | null
  link_url: string | null
  attachment_paths: string[] | null
  unit_id: string
  uploaded_by: string
  units: { title: string; courses: { name: string } | null } | null
}

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
    .single<MaterialWithUnit>()

  if (!material) notFound()
  if (material.uploaded_by !== user.id) redirect(`/s/${schoolSlug}/profile`)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <EditMaterialForm
        schoolSlug={schoolSlug}
        id={material.id}
        unitId={material.unit_id}
        initialTitle={material.title}
        initialContentType={material.content_type === 'pdf' ? 'pdf' : 'richtext'}
        initialContent={material.content_json?.text ?? ''}
        initialAttachmentPaths={material.attachment_paths ?? []}
        initialPdfPath={material.pdf_path ?? null}
        unitTitle={material.units?.title ?? ''}
        courseName={material.units?.courses?.name ?? ''}
      />
    </div>
  )
}
