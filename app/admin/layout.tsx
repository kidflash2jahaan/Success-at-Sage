import { requireSuperadmin } from '@/lib/superadmin'
import Link from 'next/link'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin()
  return (
    <div>
      <header className="sticky top-0 z-20 glass-nav border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/schools" className="text-white font-semibold text-sm">Superadmin</Link>
          <Link href="/admin/schools" className="text-white/50 text-sm hover:text-white transition-colors">School requests</Link>
          <Link href="/admin/users" className="text-white/50 text-sm hover:text-white transition-colors">All users</Link>
        </div>
        <Link href="/" className="text-white/40 text-xs hover:text-white/70">Exit</Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
