export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantBySlug } from '@/lib/tenant'
import MaterialsReviewList from '@/components/admin/MaterialsReviewList'
import UnitReviewer from '@/components/admin/UnitReviewer'

type PendingMaterialRow = {
  id: string
  title: string
  type: 'note' | 'test'
  content_type: 'richtext' | 'pdf' | null
  content_json: unknown
  pdf_path: string | null
  link_url: string | null
  attachment_paths: string[] | null
  unit_id: string
  created_at: string
  users: { full_name: string; email: string } | null
  units: { title: string; courses: { name: string } | null } | null
}

type PendingUnitRow = {
  id: string
  title: string
  course_id: string
  courses: { name: string } | null
  users: { full_name: string } | null
}

type ApprovedUnitRow = {
  id: string
  title: string
  courses: { name: string } | null
}

type CourseRow = { id: string; name: string }

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)

  const [{ data: materialsData }, { data: unitsData }, { data: approvedUnitsData }, { data: coursesData }] = await Promise.all([
    supabaseAdmin
      .from('materials')
      // Embed hints use constraint names because the composite FKs added
      // in migration 0004 (materials_uploaded_by_fk, materials_unit_fk)
      // make column-name hints (`users!uploaded_by` etc.) ambiguous —
      // PostgREST returns PGRST200 and supabase-js silently yields []. The
      // constraint-name hint is unambiguous.
      .select('id, title, type, content_type, content_json, pdf_path, link_url, attachment_paths, unit_id, created_at, users!materials_uploaded_by_fk(full_name, email), units!materials_unit_fk(title, courses(name))')
      .eq('status', 'pending')
      .eq('school_id', tenant.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('units')
      .select('id, title, course_id, courses(name), users!submitted_by(full_name)')
      .eq('status', 'pending')
      .eq('school_id', tenant.id)
      .order('id'),
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

  const materials = (materialsData ?? []) as unknown as PendingMaterialRow[]
  const units = (unitsData ?? []) as unknown as PendingUnitRow[]
  const approvedUnits = (approvedUnitsData ?? []) as unknown as ApprovedUnitRow[]
  const allCourses = (coursesData ?? []) as unknown as CourseRow[]

  // Count pending materials per pending unit by reducing the materials array
  // (which already includes every pending material in this tenant) — saves a
  // DB roundtrip.
  const pendingUnitIdSet = new Set(units.map(u => u.id))
  const materialCountsByUnit: Record<string, number> = {}
  for (const m of materials) {
    if (pendingUnitIdSet.has(m.unit_id)) {
      materialCountsByUnit[m.unit_id] = (materialCountsByUnit[m.unit_id] ?? 0) + 1
    }
  }

  const pendingUnits = units.map(u => ({
    id: u.id,
    title: u.title,
    courseName: u.courses?.name ?? '',
    submittedByName: u.users?.full_name ?? 'Unknown',
    pendingMaterialCount: materialCountsByUnit[u.id] ?? 0,
  }))

  const pending = materials.map(m => ({
    id: m.id,
    title: m.title,
    type: m.type,
    contentType: m.content_type ?? 'richtext',
    contentJson: m.content_json,
    pdfPath: m.pdf_path,
    linkUrl: m.link_url,
    attachmentPaths: m.attachment_paths ?? [],
    createdAt: m.created_at,
    uploaderName: m.users?.full_name ?? 'Unknown',
    uploaderEmail: m.users?.email ?? '',
    unitTitle: m.units?.title ?? '',
    courseName: m.units?.courses?.name ?? '',
  }))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Pending Submissions</h1>
      <p className="text-white/40 mb-8">{pendingUnits.length + pending.length} awaiting review in {tenant.displayShort}</p>

      {pendingUnits.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-400/70 mb-4">
            New Units — {pendingUnits.length}
          </h2>
          <div className="flex flex-col gap-3 max-w-3xl">
            {pendingUnits.map(unit => <UnitReviewer key={unit.id} schoolSlug={schoolSlug} unit={unit} />)}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
            Materials — {pending.length}
          </h2>
          <div className="max-w-3xl">
            <MaterialsReviewList
              schoolSlug={schoolSlug}
              items={pending}
              availableUnits={approvedUnits.map(u => ({ id: u.id, title: u.title, courseName: u.courses?.name ?? '' }))}
              courses={allCourses.map(c => ({ id: c.id, name: c.name }))}
            />
          </div>
        </div>
      )}

      {pendingUnits.length === 0 && pending.length === 0 && (
        <p className="text-white/30">All caught up!</p>
      )}
    </div>
  )
}
