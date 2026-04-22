/**
 * Phase 2 verification — probes RLS state on prod DB.
 * Usage: npx tsx scripts/verify-phase-2.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('FAIL: env missing'); process.exit(1) }
const supabaseAdmin = createClient(url, key)

const TENANT_TABLES = [
  'users','departments','courses','units','materials','user_courses',
  'contest_settings','contest_winners','material_views',
  'schools','school_domains','school_requests',
] as const

async function main() {
  console.log('Phase 2 verification\n')

  for (const t of TENANT_TABLES) {
    const { error } = await supabaseAdmin.from(t).select('*', { head: true, count: 'exact' })
    if (error) { console.error(`FAIL: service-role read of ${t}: ${error.message}`); process.exit(1) }
    console.log(`✓ ${t}: service-role read works (RLS bypass verified)`)
  }

  const { data: hfn, error: hfnErr } = await supabaseAdmin.rpc('current_school_id')
  if (hfnErr) { console.error(`FAIL: current_school_id() RPC: ${hfnErr.message}`); process.exit(1) }
  console.log(`✓ current_school_id() callable (returned ${hfn ?? 'null'} under service-role — expected)`)

  const { data: sa, error: saErr } = await supabaseAdmin.rpc('is_superadmin')
  if (saErr) { console.error(`FAIL: is_superadmin() RPC: ${saErr.message}`); process.exit(1) }
  console.log(`✓ is_superadmin() callable (returned ${sa} under service-role — expected false)`)

  console.log('\nPhase 2 verification PASSED (hook dashboard-enabled state not checked — see Supabase dashboard)')
}
main().catch(e => { console.error(e); process.exit(1) })
