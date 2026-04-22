import { requireSuperadmin } from '@/lib/superadmin'

/**
 * Superadmin layout. No persistent chrome — each page renders its own
 * header and its own in-page links between /admin/schools and
 * /admin/users. Getting back into a tenant is done by clicking the
 * "Open admin" button on the Schools page.
 */
export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperadmin()
  return <div>{children}</div>
}
