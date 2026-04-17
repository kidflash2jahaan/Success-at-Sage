import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    notFound()
  }

  return (
    <div className="flex h-screen">
      <nav className="glass-sidebar w-52 shrink-0 flex flex-col p-3 gap-0.5">
        <div className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 px-3 pt-2">Admin</div>
        {[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/submissions', label: 'Submissions' },
          { href: '/admin/users', label: 'Users' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors">
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-white/[0.06] px-1">
          <Link href="/dashboard" className="px-3 py-2.5 rounded-xl text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1.5 hover:bg-violet-500/10 transition-colors">
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
