import { cookies } from 'next/headers'
import Link from 'next/link'
import { resolveTenantBySlug } from '@/lib/tenant'
import { isSuperadmin } from '@/lib/superadmin'
import { stopImpersonating } from '@/app/actions/superadmin'

/**
 * Tenant layout.
 *
 * - Resolves URL slug → Tenant (404 if no match)
 * - If the visitor is the superadmin AND has an `impersonating_school`
 *   cookie set to this slug, shows a persistent banner so they always
 *   know they're viewing someone else's tenant
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)

  const c = await cookies()
  const impersonatingSlug = c.get('impersonating_school')?.value
  const superadmin = impersonatingSlug === schoolSlug ? await isSuperadmin() : false

  return (
    <>
      {superadmin && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-amber-200">
            <span className="font-semibold">Impersonating:</span> {tenant.name} <span className="text-amber-200/60">({tenant.slug})</span>
          </span>
          <form action={stopImpersonating}>
            <button type="submit" className="text-amber-100 hover:text-white underline underline-offset-2">exit</button>
          </form>
        </div>
      )}
      {children}
    </>
  )
}
