export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { units, courses, departments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
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

  const [unit] = await db.select().from(units).where(eq(units.id, id))
  if (!unit) notFound()

  const [course] = await db.select().from(courses).where(eq(courses.id, unit.courseId))
  const [dept] = await db.select().from(departments).where(eq(departments.id, course.departmentId))
  const approvedMaterials = await getApprovedMaterialsForUnit(id)

  const notes = approvedMaterials.filter(m => m.type === 'note')
  const tests = approvedMaterials.filter(m => m.type === 'test')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: dept.colorAccent }}>
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
            {notes.map(m => <MaterialCard key={m.id} material={m} accentColor={dept.colorAccent} />)}
          </div>
        </section>
      )}

      {tests.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white/40 mb-3">Past Tests</h2>
          <div className="flex flex-col gap-2">
            {tests.map(m => <MaterialCard key={m.id} material={m} accentColor={dept.colorAccent} />)}
          </div>
        </section>
      )}

      {approvedMaterials.length === 0 && (
        <p className="text-white/30 text-center py-12">No materials yet. Be the first to submit!</p>
      )}
    </div>
  )
}
