import { requireAdmin } from '@/lib/auth'
import { isSuperadmin } from '@/lib/superadmin'
import { resolveTenantBySlug } from '@/lib/tenant'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  try {
    // Pass tenant.id so non-superadmin admins can't cross-tenant-escalate
    await requireAdmin(tenant.id)
  } catch {
    notFound()
  }
  const showAllSchools = await isSuperadmin()

  return (
    <div className="flex h-screen">
      <nav className="glass-sidebar w-52 shrink-0 flex flex-col p-3 gap-0.5">
        <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 px-3 pt-2">Admin</div>
        {[
          { href: `/s/${schoolSlug}/admin`,             label: 'Dashboard' },
          { href: `/s/${schoolSlug}/admin/submissions`, label: 'Submissions' },
          { href: `/s/${schoolSlug}/admin/courses`,     label: 'All Materials' },
          { href: `/s/${schoolSlug}/admin/users`,       label: 'Users' },
          { href: `/s/${schoolSlug}/admin/contest`,     label: 'Contest' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors">
            {item.label}
          </Link>
        ))}

        {showAllSchools && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/60 mt-5 mb-1 px-3">Superadmin</div>
            <Link href="/admin/schools"
              className="px-3 py-2.5 rounded-xl text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Schools
            </Link>
          </>
        )}

        <div className="mt-auto pt-4 border-t border-white/[0.06] px-1">
          <Link href={`/s/${schoolSlug}/dashboard`} className="px-3 py-2.5 rounded-xl text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1.5 hover:bg-violet-500/10 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Student View
          </Link>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
