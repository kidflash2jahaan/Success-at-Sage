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
    <div className="flex h-screen bg-[#1a1a2e]">
      <nav className="w-52 shrink-0 bg-[#16213e] border-r border-white/10 flex flex-col p-4 gap-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 px-2">Admin</div>
        {[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/submissions', label: 'Submissions' },
          { href: '/admin/courses', label: 'Courses' },
          { href: '/admin/users', label: 'Users' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-white/10">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg text-sm text-purple-400 hover:text-purple-300 block">
            ← Student View
          </Link>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
