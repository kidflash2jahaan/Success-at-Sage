export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getApprovedMaterialsForUnit } from '@/lib/db/queries/materials'
import MaterialCard from '@/components/materials/MaterialCard'
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
    .eq('id', unit.course_id)
    .single()

  const { data: dept } = await supabaseAdmin
    .from('departments')
    .select('id, name, color_accent')
    .eq('id', course.department_id)
    .single()

  const approvedMaterials = await getApprovedMaterialsForUnit(id)
  const notes = approvedMaterials.filter(m => m.type === 'note')
  const tests = approvedMaterials.filter(m => m.type === 'test')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: dept.color_accent }}>
        <Link href={`/courses/${slug}`} className="hover:underline">{course.name}</Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{unit.title}</h1>
      <div className="flex items-center justify-between mb-8">
        <p className="text-white/40 text-sm">{approvedMaterials.length} materials</p>
        <Link href="/submit" className="text-sm text-purple-400 hover:text-purple-300">+ Submit Material</Link>
      </div>

      {notes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-3">Study Notes</h2>
          <div className="flex flex-col gap-2">
            {notes.map(m => <MaterialCard key={m.id} material={m} accentColor={dept.color_accent} />)}
          </div>
        </section>
      )}

      {tests.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-3">Past Tests</h2>
          <div className="flex flex-col gap-2">
            {tests.map(m => <MaterialCard key={m.id} material={m} accentColor={dept.color_accent} />)}
          </div>
        </section>
      )}

      {approvedMaterials.length === 0 && (
        <p className="text-white/30 text-center py-12">No materials yet. Be the first to submit!</p>
      )}
    </div>
  )
}
