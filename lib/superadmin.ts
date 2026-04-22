import 'server-only'
import { redirect } from 'next/navigation'
import { getUser } from './supabase/server'
import { supabaseAdmin } from './supabase/admin'

/**
 * Superadmin status via DB: the private.superadmin_emails table is the
 * single source of truth, seeded from the ADMIN_EMAILS env var. Reads
 * go through the is_superadmin_email RPC (SECURITY DEFINER into the
 * private schema).
 *
 * The JWT also carries an is_superadmin claim via the Custom Access
 * Token hook, but claims can be stale up to an hour — we prefer the DB
 * check so changes take effect immediately.
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
