export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import ApprovedMaterialEditor from '@/components/admin/ApprovedMaterialEditor'

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)

  const [{ data }, { data: unitsData }, { data: coursesData }] = await Promise.all([
    supabaseAdmin
      .from('materials')
      .select('id, title, type, content_type, content_json, pdf_path, link_url, attachment_paths, units!unit_id(id, title, courses(name))')
      .eq('status', 'approved')
      .eq('school_id', tenant.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('units')
      .select('id, title, courses(name)')
      .eq('status', 'approved')
      .eq('school_id', tenant.id)
      .order('title'),
    supabaseAdmin
      .from('courses')
      .select('id, name')
      .eq('school_id', tenant.id)
      .order('name'),
  ])

  const availableUnits = (unitsData ?? []).map((u: any) => ({
    id: u.id as string,
    title: u.title as string,
    courseName: (u.courses?.name ?? '') as string,
  }))

  const courses = (coursesData ?? []).map((c: any) => ({ id: c.id as string, name: c.name as string }))

  type Row = {
    id: string; title: string; type: string; content_type: string
    content_json: unknown; pdf_path: string | null; link_url: string | null
    attachment_paths: string[]
    units: { id: string; title: string; courses: { name: string } | null } | null
  }

  const materials = (data ?? []) as unknown as Row[]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">All Materials</h1>
      <p className="text-white/40 mb-8">{materials.length} approved in {tenant.displayShort}</p>

      <div className="flex flex-col gap-3 max-w-3xl">
        {materials.map(m => (
          <ApprovedMaterialEditor
            key={m.id}
            schoolSlug={schoolSlug}
            availableUnits={availableUnits}
            courses={courses}
            item={{
              id: m.id,
              title: m.title,
              type: m.type,
              contentType: (m.content_type ?? 'richtext') as 'richtext' | 'pdf',
              contentJson: m.content_json,
              pdfPath: m.pdf_path,
              linkUrl: m.link_url,
              attachmentPaths: m.attachment_paths ?? [],
            }}
          />
        ))}

        {materials.length === 0 && (
          <p className="text-white/30">No approved materials yet.</p>
        )}
      </div>
    </div>
  )
}
