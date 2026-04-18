export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import ApprovedMaterialEditor from '@/components/admin/ApprovedMaterialEditor'

export default async function AdminCoursesPage() {
  const { data } = await supabaseAdmin
    .from('materials')
    .select('id, title, type, content_type, content_json, pdf_path, link_url, attachment_paths, units!unit_id(id, title, courses(name))')
    .eq('status', 'approved')
    .order('created_at')

  type Row = {
    id: string; title: string; type: string; content_type: string
    content_json: unknown; pdf_path: string | null; link_url: string | null
    attachment_paths: string[]
    units: { id: string; title: string; courses: { name: string } | null } | null
  }

  const grouped: Record<string, { courseName: string; unitTitle: string; materials: Row[] }> = {}
  for (const m of (data ?? []) as unknown as Row[]) {
    const key = m.units?.id ?? 'unknown'
    if (!grouped[key]) grouped[key] = {
      courseName: m.units?.courses?.name ?? '',
      unitTitle: m.units?.title ?? '',
      materials: [],
    }
    grouped[key].materials.push(m)
  }

  const sections = Object.entries(grouped).sort(([, a], [, b]) =>
    a.courseName.localeCompare(b.courseName) || a.unitTitle.localeCompare(b.unitTitle)
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Approved Materials</h1>
      <p className="text-white/40 mb-8">{(data ?? []).length} materials across {sections.length} units</p>

      <div className="flex flex-col gap-8 max-w-3xl">
        {sections.map(([unitId, section]) => (
          <div key={unitId}>
            <div className="mb-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-white/30">{section.courseName}</div>
              <div className="text-white font-medium mt-0.5">{section.unitTitle}</div>
            </div>
            <div className="flex flex-col gap-3">
              {section.materials.map(m => (
                <ApprovedMaterialEditor
                  key={m.id}
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
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <p className="text-white/30">No approved materials yet.</p>
        )}
      </div>
    </div>
  )
}
