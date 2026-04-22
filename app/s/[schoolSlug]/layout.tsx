import { resolveTenantBySlug } from '@/lib/tenant'

/**
 * Tenant layout — resolves URL slug → Tenant and 404s if no school matches.
 * Pages nested under this layout read params.schoolSlug for their own tenant
 * context.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  await resolveTenantBySlug(schoolSlug)
  return <>{children}</>
}
