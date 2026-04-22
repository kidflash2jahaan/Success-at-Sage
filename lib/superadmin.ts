import 'server-only'
import { redirect } from 'next/navigation'
import { getUser } from './supabase/server'
import { supabaseAdmin } from './supabase/admin'

/**
 * Superadmin status via DB (single source of truth — the
 * private.superadmin_emails table seeded from ADMIN_EMAILS env var in
 * Phase 2). Uses the public.is_superadmin_email RPC which security-
 * definers into private schema.
 *
 * Alternative fast-path would be to read the is_superadmin JWT claim
 * set by the Custom Access Token hook, but that can be stale up to 1h
 * after a change — DB check is always fresh.
 */
export async function isSuperadmin(): Promise<boolean> {
  const authUser = await getUser()
  if (!authUser?.email) return false
  const { data } = await supabaseAdmin.rpc('is_superadmin_email', { p_email: authUser.email })
  return data === true
}

export async function requireSuperadmin() {
  const authUser = await getUser()
  if (!authUser) redirect('/login')
  if (!authUser.email) redirect('/login')
  const { data } = await supabaseAdmin.rpc('is_superadmin_email', { p_email: authUser.email })
  if (data !== true) redirect('/')
}
