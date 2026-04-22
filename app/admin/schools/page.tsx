export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'

type SchoolRequestRow = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  proposed_slug: string
  proposed_name: string
  proposed_domains: string[] | null
  requester_email: string
  requester_role: string | null
}

type SchoolRow = {
  id: string
  slug: string
  name: string
  display_short: string
  contest_enabled: boolean
  created_at: string
}

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; rejected?: string }>
}) {
  const { approved, rejected } = await searchParams

  const [{ data: pending }, { data: schools }] = await Promise.all([
    supabaseAdmin
      .from('school_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<SchoolRequestRow[]>(),
    supabaseAdmin
      .from('schools')
      .select('id, slug, name, display_short, contest_enabled, created_at')
      .order('created_at', { ascending: false })
      .returns<SchoolRow[]>(),
  ])

  const reqs = pending ?? []
  const scs = schools ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-white">Schools</h1>
        <Link
          href="/admin/users"
          className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          View users →
        </Link>
      </div>

      {approved === '1' && (
        <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          Approved.
        </div>
      )}
      {rejected === '1' && (
        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
          Rejected.
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-white/50 text-xs uppercase tracking-widest mb-3">Pending & recent requests</h2>
        {reqs.length === 0 ? (
          <div className="text-white/40 text-sm">No requests yet.</div>
        ) : (
          <ul className="space-y-3">
            {reqs.map((r) => (
              <li key={r.id} className="glass rounded-2xl p-4 border border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{r.proposed_name}</div>
                    <div className="text-white/40 text-xs mt-0.5">
                      /{r.proposed_slug} · {(r.proposed_domains ?? []).join(', ')} · {r.requester_email} ({r.requester_role ?? '—'})
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={
                      r.status === 'approved' ? 'text-xs text-green-400' :
                      r.status === 'rejected' ? 'text-xs text-white/40' :
                      'text-xs text-amber-400'
                    }>{r.status}</span>
                    <Link href={`/admin/schools/${r.id}`} className="text-white/50 text-xs hover:text-white underline underline-offset-2">
                      review →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-white/50 text-xs uppercase tracking-widest mb-3">Tenants</h2>
        <ul className="space-y-2">
          {scs.map((s) => (
            <li key={s.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-white text-sm font-medium">{s.name} <span className="text-white/30 text-xs font-normal">/{s.slug}</span></div>
                <div className="text-white/40 text-xs">contest: {s.contest_enabled ? 'on' : 'off'}</div>
              </div>
              <Link href={`/s/${s.slug}/admin`} className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium">
                open admin →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
