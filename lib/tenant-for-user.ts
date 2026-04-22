import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Look up the current user's school_id from their users row.
 * Used by server actions that need tenant context but can't take a
 * slug arg (they were originally written as Sage-only mutations).
 *
 * Assumes the caller has already verified requireUser(). Throws if the
 * user has no row (should never happen post-onboarding).
 */
export async function getUserSchoolId(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('school_id')
    .eq('id', userId)
    .single()
  if (error || !data) throw new Error(`No users row for ${userId}: ${error?.message ?? 'not found'}`)
  return (data as any).school_id as string
}
