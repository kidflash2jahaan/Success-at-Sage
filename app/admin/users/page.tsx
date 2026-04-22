export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateGrade } from '@/lib/auth'
import Link from 'next/link'

/**
 * Superadmin cross-tenant users view.
 *
 * Lists every user across every school — the one place where the
 * tenant partition is deliberately pierced, so a superadmin can find
 * a user no matter which school they belong to. The layout gate
 * (app/admin/layout.tsx → requireSuperadmin) keeps regular tenant
 * admins out.
 */
export default async function SuperadminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string; q?: string }>
}) {
  const { school, q } = await searchParams

  let userQuery = supabaseAdmin
    .from('users')
    .select('id, email, full_name, graduating_year, role, school_id, schools(slug, display_short, name)')
    .order('created_at')
  if (school) userQuery = userQuery.eq('schools.slug', school)
  if (q?.trim()) {
    const term = `%${q.trim()}%`
    userQuery = userQuery.or(`full_name.ilike.${term},email.ilike.${term}`)
  }

  const [{ data: usersData }, { data: schoolsData }] = await Promise.all([
    userQuery,
    supabaseAdmin.from('schools').select('slug, display_short').order('display_short'),
  ])

  const users = ((usersData ?? []) as any[])
    // When `school` is set, Supabase returns rows where schools is null for
    // non-matching joins — filter those out client-side.
    .filter(u => !school || u.schools?.slug === school)

  const schools = ((schoolsData ?? []) as { slug: string; display_short: string }[])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">All users</h1>
      <p className="text-white/40 text-sm mb-6">
        {users.length} {users.length === 1 ? 'user' : 'users'} across {schools.length} {schools.length === 1 ? 'school' : 'schools'}
      </p>

      {/* Filters */}
      <form className="mb-6 flex flex-wrap items-center gap-2" action="/admin/users">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search name or email…"
          className="flex-1 min-w-[200px] glass-input rounded-xl px-4 py-2 text-sm text-white"
        />
        <select
          name="school"
          defaultValue={school ?? ''}
          className="glass-input rounded-xl px-3 py-2 text-sm text-white"
        >
          <option value="">All schools</option>
          {schools.map(s => (
            <option key={s.slug} value={s.slug}>{s.display_short}</option>
          ))}
        </select>
        <button
          type="submit"
          className="text-sm px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
        >
          Filter
        </button>
        {(school || q) && (
          <Link
            href="/admin/users"
            className="text-sm px-4 py-2 rounded-xl text-white/50 hover:text-white transition-colors"
          >
            Reset
          </Link>
        )}
      </form>

      {/* List */}
      <div className="flex flex-col gap-2">
        {users.map(u => {
          const { label } = calculateGrade(u.graduating_year ?? 0)
          const school = u.schools as { slug: string; display_short: string; name: string } | null
          return (
            <div key={u.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <div className="min-w-0">
                <div className="text-white font-medium truncate">{u.full_name}</div>
                <div className="text-white/40 text-xs truncate">
                  {u.email} · {label} · Class of {u.graduating_year ?? '—'}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {school && (
                  <Link
                    href={`/s/${school.slug}/admin/users`}
                    className="text-xs px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-400 hover:text-amber-300 hover:border-amber-400/60 transition-colors"
                    title={school.name}
                  >
                    {school.display_short}
                  </Link>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  u.role === 'admin'
                    ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                    : 'border-white/10 text-white/40'
                }`}>{u.role}</span>
                {school && (
                  <Link
                    href={`/s/${school.slug}/admin/users/${u.id}`}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          )
        })}
        {users.length === 0 && (
          <p className="text-white/30 text-sm">No users match that filter.</p>
        )}
      </div>
    </div>
  )
}
