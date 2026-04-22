export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantByEmail } from '@/lib/tenant'
import { redirect } from 'next/navigation'

/**
 * Root landing.
 *
 * Post-Phase-3 behavior:
 * - Authenticated user → redirect to /s/<their-tenant-slug>/dashboard
 *   (resolved from email domain; falls back to Sage if unmatched)
 * - Anonymous user → redirect to Sage's tenant landing (Sage is the
 *   flagship tenant and the only one that exists today)
 *
 * Phase 4 will replace the anon path with a real generic marketing page
 * once the multi-tenant signup flow is live.
 */
export default async function RootLanding() {
  const user = await getCurrentUser().catch(() => null)
  if (user?.email) {
    const tenant = await resolveTenantByEmail(user.email)
    if (tenant) redirect(`/s/${tenant.slug}/dashboard`)
  }
  redirect('/s/sage')
}
