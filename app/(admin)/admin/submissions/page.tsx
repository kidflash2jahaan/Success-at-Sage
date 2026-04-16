export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import SubmissionReviewer from '@/components/admin/SubmissionReviewer'
import UnitReviewer from '@/components/admin/UnitReviewer'

export default async function SubmissionsPage() {
  const [{ data: materialsData }, { data: unitsData }] = await Promise.all([
    supabaseAdmin
      .from('materials')
      .select('id, title, type, content_json, link_url, attachment_url, created_at, users!uploaded_by(full_name, email), units!unit_id(title, courses(name))')
      .eq('status', 'pending')
      .order('created_at'),
    supabaseAdmin
      .from('units')
      .select('id, title, course_id, courses(name), users!submitted_by(full_name)')
      .eq('status', 'pending')
      .order('id'),
  ])

  // Count pending materials per pending unit
  const pendingUnitIds = (unitsData ?? []).map((u: any) => u.id)
  let materialCountsByUnit: Record<string, number> = {}
  if (pendingUnitIds.length > 0) {
    const { data: counts } = await supabaseAdmin
      .from('materials')
      .select('unit_id')
      .in('unit_id', pendingUnitIds)
      .eq('status', 'pending')
    ;(counts ?? []).forEach((m: any) => {
      materialCountsByUnit[m.unit_id] = (materialCountsByUnit[m.unit_id] ?? 0) + 1
    })
  }

  const pendingUnits = (unitsData ?? []).map((u: any) => ({
    id: u.id,
    title: u.title,
    courseName: u.courses?.name ?? '',
    submittedByName: u.users?.full_name ?? 'Unknown',
    pendingMaterialCount: materialCountsByUnit[u.id] ?? 0,
  }))

  const pending = (materialsData ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    type: m.type,
    contentJson: m.content_json,
    linkUrl: m.link_url ?? null,
    attachmentUrl: m.attachment_url ?? null,
    createdAt: m.created_at,
    uploaderName: m.users?.full_name ?? 'Unknown',
    uploaderEmail: m.users?.email ?? '',
    unitTitle: m.units?.title ?? '',
    courseName: m.units?.courses?.name ?? '',
  }))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Pending Submissions</h1>
      <p className="text-white/40 mb-8">{pendingUnits.length + pending.length} awaiting review</p>

      {pendingUnits.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-4">
            New Units — {pendingUnits.length}
          </h2>
          <div className="flex flex-col gap-3 max-w-3xl">
            {pendingUnits.map(unit => <UnitReviewer key={unit.id} unit={unit} />)}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
            Materials — {pending.length}
          </h2>
          <div className="flex flex-col gap-4 max-w-3xl">
            {pending.map(item => <SubmissionReviewer key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {pendingUnits.length === 0 && pending.length === 0 && (
        <p className="text-white/30">All caught up!</p>
      )}
    </div>
  )
}
