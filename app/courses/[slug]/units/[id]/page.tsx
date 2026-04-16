export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getApprovedMaterialsForUnit } from '@/lib/db/queries/materials'
import MaterialCard from '@/components/materials/MaterialCard'
import BackToDashboard from '@/components/BackToDashboard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  await requireUser()
  const { slug, id } = await params

  const { data: unit } = await supabaseAdmin
    .from('units')
    .select('id, title, course_id')
    .eq('id', id)
    .single()
  if (!unit) notFound()

  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, name, department_id')
    .eq('id', (unit as any).course_id)
    .single()
  if (!course) notFound()

  const { data: dept } = await supabaseAdmin
    .from('departments')
    .select('id, name, color_accent')
    .eq('id', (course as any).department_id)
    .single()
  if (!dept) notFound()

  const approvedMaterials = await getApprovedMaterialsForUnit(id)
  const notes = approvedMaterials.filter(m => m.type === 'note')
  const tests = approvedMaterials.filter(m => m.type === 'test')
  const accentColor = (dept as any).color_accent

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackToDashboard />

      {/* Header */}
      <div className="animate-scale-in glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}80` }} />
          <Link
            href={`/courses/${slug}`}
            className="text-xs font-semibold uppercase tracking-widest hover:opacity-80 transition-opacity"
            style={{ color: accentColor }}
          >
            {course.name}
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-3">{unit.title}</h1>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/30">{approvedMaterials.length} material{approvedMaterials.length !== 1 ? 's' : ''}</span>
          <Link href="/submit" className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
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
                <MaterialCard material={m} accentColor={accentColor} />
              </div>
            ))}
          </div>
        </section>
      )}

      {tests.length > 0 && (
        <section className="animate-fade-up stagger-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 px-1">Past Tests</h2>
          <div className="flex flex-col gap-2">
            {tests.map((m, i) => (
              <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${0.25 + i * 0.06}s` }}>
                <MaterialCard material={m} accentColor={accentColor} />
              </div>
            ))}
          </div>
        </section>
      )}

      {approvedMaterials.length === 0 && (
        <div className="glass rounded-2xl px-6 py-14 text-center">
          <p className="text-white/25 text-sm">No materials yet.</p>
          <Link href="/submit" className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 mt-3 transition-colors">
            Be the first to submit →
          </Link>
        </div>
      )}
    </div>
  )
}
