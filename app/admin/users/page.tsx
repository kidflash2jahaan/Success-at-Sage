export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { calculateGrade } from '@/lib/auth'
import Link from 'next/link'

/**
 * Superadmin cross-tenant users view.
 *
 * Lists every user across every school, grouped by school. This is the
 * one place where the tenant partition is deliberately pierced, so a
 * superadmin can audit or find a user regardless of which school they
 * belong to. The layout gate (app/admin/layout.tsx → requireSuperadmin)
 * keeps regular tenant admins out.
 *
 * Per-row layout matches the tenant admin /s/<slug>/admin/users page
 * so the reading experience is consistent — just adds a school header
 * above each group.
 */
export default async function SuperadminUsersPage() {
  const [{ data: schoolsData }, { data: usersData }] = await Promise.all([
    supabaseAdmin
      .from('schools')
      .select('id, slug, name, display_short')
      .order('display_short'),
    supabaseAdmin
      .from('users')
      .select('id, email, full_name, graduating_year, role, school_id')
      .order('created_at'),
  ])

  const schools = (schoolsData ?? []) as {
    id: string; slug: string; name: string; display_short: string
  }[]
  const users = (usersData ?? []) as {
    id: string; email: string; full_name: string; graduating_year: number
    role: 'student' | 'admin'; school_id: string
  }[]

  const usersBySchool = new Map<string, typeof users>()
  for (const u of users) {
    const group = usersBySchool.get(u.school_id) ?? []
    group.push(u)
    usersBySchool.set(u.school_id, group)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <Link
          href="/admin/schools"
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          ← Schools
        </Link>
      </div>

      <p className="text-white/40 text-sm mb-8">
        {users.length} {users.length === 1 ? 'user' : 'users'} across {schools.length} {schools.length === 1 ? 'school' : 'schools'}
      </p>

      <div className="flex flex-col gap-10">
        {schools.map(school => {
          const group = usersBySchool.get(school.id) ?? []
          return (
            <section key={school.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-400">
                    {school.display_short}
                  </h2>
                  <span className="text-xs text-white/30">
                    {group.length} {group.length === 1 ? 'user' : 'users'}
                  </span>
                </div>
                <Link
                  href={`/s/${school.slug}/admin/users`}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Open in admin →
                </Link>
              </div>

              {group.length === 0 ? (
                <p className="text-white/25 text-sm">No users in this school yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {group.map(u => {
                    const { label } = calculateGrade(u.graduating_year)
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">{u.full_name}</div>
                          <div className="text-white/40 text-xs truncate">
                            {u.email} · {label} · Class of {u.graduating_year}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            u.role === 'admin'
                              ? 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                              : 'border-white/10 text-white/40'
                          }`}>{u.role}</span>
                          <Link
                            href={`/s/${school.slug}/admin/users/${u.id}`}
                            className="text-xs text-white/40 hover:text-white/70 transition-colors"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
