/**
 * Phase 1 verification — run against prod DB after migrations 0002-0005
 * have applied. Exits 1 on any failure.
 *
 * Usage: npx tsx scripts/verify-phase-1.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from '@supabase/supabase-js'
import { SAGE_SCHOOL_ID } from '../lib/constants'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('FAIL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'); process.exit(1) }
const supabaseAdmin = createClient(url, key)

const TENANT_TABLES = [
  'users','departments','courses','units','materials',
  'user_courses','contest_settings','contest_winners',
] as const

async function main() {
  console.log('Phase 1 verification\n')

  const { data: sage, error: sageErr } = await supabaseAdmin
    .from('schools').select('slug,name,contest_enabled')
    .eq('id', SAGE_SCHOOL_ID).single()
  if (sageErr || !sage) { console.error(`FAIL: Sage row missing: ${sageErr?.message}`); process.exit(1) }
  console.log(`✓ schools row: ${sage.slug} / ${sage.name} / contest=${sage.contest_enabled}`)

  for (const t of TENANT_TABLES) {
    const { count, error } = await supabaseAdmin
      .from(t).select('*', { count: 'exact', head: true }).is('school_id', null)
    if (error) { console.error(`FAIL: ${t} probe: ${error.message}`); process.exit(1) }
    if (count && count > 0) { console.error(`FAIL: ${t} has ${count} NULL school_id`); process.exit(1) }
    console.log(`✓ ${t}: no NULL school_id`)
  }

  const { data: cs } = await supabaseAdmin
    .from('contest_settings').select('school_id,prize_description')
    .eq('school_id', SAGE_SCHOOL_ID).single()
  if (!cs) { console.error('FAIL: contest_settings Sage row missing'); process.exit(1) }
  console.log(`✓ contest_settings keyed by school_id; prize = "${cs.prize_description}"`)

  const { count: userCount } = await supabaseAdmin
    .from('users').select('*', { count: 'exact', head: true })
    .eq('school_id', SAGE_SCHOOL_ID)
  console.log(`✓ users under Sage: ${userCount}`)

  console.log('\nPhase 1 verification PASSED')
}
main().catch(e => { console.error(e); process.exit(1) })
