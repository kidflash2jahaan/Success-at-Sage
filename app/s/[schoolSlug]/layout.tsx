import { resolveTenantBySlug } from '@/lib/tenant'

/**
 * Tenant layout — resolves the URL slug to a Tenant and 404s if no
 * school matches. Pages nested under this layout can call
 * resolveTenantBySlug(slug) (memoized per request via React cache) or
 * read params.schoolSlug from their own params prop.
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  // Triggers notFound() if slug doesn't exist; cached so nested pages
  // calling resolveTenantBySlug(slug) don't re-hit the DB.
  await resolveTenantBySlug(schoolSlug)
  return <>{children}</>
}
