export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { searchContent } from '@/lib/db/queries/materials'
import Link from 'next/link'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireUser()
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  if (!query) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Search</h1>
        <p className="text-white/40">Enter a query in the search bar above.</p>
      </div>
    )
  }

  const { courses, materials } = await searchContent(query)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">Results for &ldquo;{query}&rdquo;</h1>
      <p className="text-white/40 mb-8">{courses.length + materials.length} results</p>

      {courses.length > 0 && (
        <section className="animate-fade-up mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Courses</h2>
          <div className="flex flex-col gap-2">
            {courses.map((course, i) => (
              <Link key={course.id} href={`/courses/${course.slug}`}
                className="animate-fade-up card-hover glass flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:bg-white/[0.07]"
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: course.colorAccent, boxShadow: `0 0 6px ${course.colorAccent}80` }} />
                <div>
                  <div className="text-white font-medium text-sm">{course.name}</div>
                  <div className="text-white/40 text-xs">{course.departmentName}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {materials.length > 0 && (
        <section className="animate-fade-up stagger-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Materials</h2>
          <div className="flex flex-col gap-2">
            {materials.map((m, i) => (
              <Link key={m.id} href={`/courses/${m.courseSlug}/units/${m.unitId}`}
                className="animate-fade-up card-hover glass flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:bg-white/[0.07]"
                style={{ animationDelay: `${0.12 + i * 0.06}s` }}>
                <div>
                  <div className="text-white font-medium text-sm">{m.title}</div>
                  <div className="text-white/40 text-xs">{m.courseName} · {m.unitTitle}</div>
                </div>
                <span className="text-xs text-white/30 capitalize">{m.type}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 && materials.length === 0 && (
        <p className="text-white/30">No results found.</p>
      )}
    </div>
  )
}
