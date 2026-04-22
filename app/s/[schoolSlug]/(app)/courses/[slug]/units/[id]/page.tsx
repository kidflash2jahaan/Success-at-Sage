export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { getApprovedMaterialsForUnit } from '@/lib/db/queries/materials'
import { resolveTenantBySlug } from '@/lib/tenant'
import MaterialCard from '@/components/materials/MaterialCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function UnitPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; slug: string; id: string }>
}) {
  const { schoolSlug, slug, id } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)

  // Cross-tenant guard: unit id is a UUID (globally unique), but we still
  // verify the row belongs to this tenant so a Sage URL can't render an
  // Oakwood unit's contents.
  const { data: unit } = await supabaseAdmin
    .from('units')
    .select('id, title, course_id, school_id')
    .eq('id', id)
    .eq('school_id', tenant.id)
    .single<{ id: string; title: string; course_id: string; school_id: string }>()
  if (!unit) notFound()

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, name, department_id')
    .eq('id', unit.course_id)
    .eq('school_id', tenant.id)
    .single<{ id: string; name: string; department_id: string }>()
  if (!course) notFound()

  const { data: dept } = await supabaseAdmin
    .from('departments')
    .select('id, name, color_accent')
    .eq('id', course.department_id)
    .eq('school_id', tenant.id)
    .single<{ id: string; name: string; color_accent: string }>()
  if (!dept) notFound()

  const approvedMaterials = await getApprovedMaterialsForUnit(id)
  const notes = approvedMaterials.filter(m => m.type === 'note')
  const tests = approvedMaterials.filter(m => m.type === 'test')
  const accentColor = dept.color_accent

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="animate-scale-in glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}80` }} />
          <Link
            href={`/s/${schoolSlug}/courses/${slug}`}
            className="text-xs font-semibold uppercase tracking-widest hover:opacity-80 transition-opacity"
            style={{ color: accentColor }}
          >
            {course.name}
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-3">{unit.title}</h1>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/30">{approvedMaterials.length} material{approvedMaterials.length !== 1 ? 's' : ''}</span>
          <Link href={`/s/${schoolSlug}/submit?course=${slug}&unit=${id}`} className="btn-press text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Material
          </Link>
        </div>
      </div>

      {notes.length > 0 && (
        <section className="mb-6 animate-fade-up stagger-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 px-1">Study Notes</h2>
          <div className="flex flex-col gap-2">
            {notes.map((m, i) => (
              <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
                <MaterialCard material={m} accentColor={accentColor} courseSlug={slug} unitId={id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {tests.length > 0 && (
        <section className="animate-fade-up stagger-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 px-1">Practice Tests</h2>
          <div className="flex flex-col gap-2">
            {tests.map((m, i) => (
              <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${0.25 + i * 0.06}s` }}>
                <MaterialCard material={m} accentColor={accentColor} courseSlug={slug} unitId={id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {approvedMaterials.length === 0 && (
        <div className="glass rounded-2xl px-6 py-14 text-center">
          <p className="text-white/25 text-sm">No materials yet.</p>
          <Link href={`/s/${schoolSlug}/submit?course=${slug}&unit=${id}`} className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 mt-3 transition-colors">
            Be the first to submit →
          </Link>
        </div>
      )}
    </div>
  )
}
