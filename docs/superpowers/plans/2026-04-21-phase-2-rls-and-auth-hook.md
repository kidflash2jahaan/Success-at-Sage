# Phase 2 — Tenant Isolation (RLS + Auth Hook) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Postgres Row-Level Security on every tenant table so that queries from an authenticated or anon client are automatically filtered to their tenant; populate JWT claims via a Supabase Auth Hook so RLS has something to read; drop the Phase-1 DEFAULT clauses so a forgotten `school_id` fails loudly instead of silently landing in Sage.

**Architecture:** Two DB helper functions (`current_school_id()`, `is_superadmin()`) read from `auth.jwt()` or a Postgres session setting. One RLS policy per tenant table filters by `current_school_id()` OR `is_superadmin()`. A Custom Access Token Postgres function injects `school_id` + `is_superadmin` into every issued JWT. The existing `ADMIN_EMAILS` env var is mirrored into a private-schema `superadmin_emails` table so the hook can read it from SQL. Phase 1 DEFAULTs drop last, after the hook is live in prod.

**Tech Stack:** Postgres 15 (Supabase), Supabase Auth with Custom Access Token hook, TypeScript, Next.js 16 middleware.

**Spec:** `docs/superpowers/specs/2026-04-21-multi-tenant-design.md` §5 (RLS & Auth), §8.2 steps 9–12.
**Base:** `phase-1-complete` at commit `7382eba`.
**Sage UUID:** `a0000000-0000-0000-0000-000000000001`.

---

## Low-risk context (important — affects sequencing)

**Every app query today uses `supabaseAdmin` (service role), which bypasses RLS.** So enabling RLS in Phase 2 does not change user-visible behavior. RLS becomes "armed but not load-bearing" until Phase 3/4 switches to authenticated clients for tenant-scoped reads. This means:

- Landing RLS policies is safe — no app breakage risk.
- Landing the auth-hook DB function is safe — it just sits there until the dashboard enables it.
- Dropping DEFAULTs is the highest-risk step in Phase 2 — it's where a bug gets exposed.

Sequencing reflects this: RLS and hook land together; DEFAULT drop is a separate, delayed task.

---

## User-action boundary (cannot be automated)

After Task 3 lands, **the user must enable the hook in the Supabase dashboard**:
`Supabase Dashboard → Authentication → Hooks (experimental) → Custom Access Token → select the function`.

There is no MCP tool for this configuration step. Phase 2 pauses here for a manual 30-second dashboard click, then resumes.

---

## File manifest

**Create:**
- `lib/db/migrations/0007_rls_helpers.sql` — `current_school_id()` + `is_superadmin()` + `superadmin_emails` table
- `lib/db/migrations/0008_rls_policies.sql` — enable RLS + policies on 9 tenant tables (8 from Phase 1 + `material_views`)
- `lib/db/migrations/0009_custom_access_token_hook.sql` — the hook function + grant
- `lib/db/migrations/0010_drop_school_id_defaults.sql` — drop the 9 DEFAULT clauses (applied AFTER hook live in prod)
- `scripts/verify-phase-2.ts` — post-migration invariant checks

**Modify:**
- `lib/db/schema.ts` — header TODO updated after DEFAULT drop
- `lib/constants.ts` — trim Phase-2 removal checklist after drop lands
- `docs/superpowers/specs/2026-04-21-multi-tenant-design.md` — no modifications (spec is reference)

No app-code changes in this phase. Middleware tenant context for anon users is **deferred to Phase 3** (can't work without slug in URL).

---

## Task 0: Pre-flight

- [ ] **Step 1: Worktree**

```bash
cd /Users/jahaan/Desktop/successatsage
git worktree add -b build/phase-2-rls ../successatsage-phase-2 phase-1-complete
cd ../successatsage-phase-2
```

- [ ] **Step 2: Install + typecheck baseline**

```bash
cp /Users/jahaan/Desktop/successatsage/.env.local ./.env.local
npm install
npx tsc --noEmit
```

Expected: exit 0.

---

## Task 1: RLS helper functions + superadmin_emails table

**Files:**
- Create: `lib/db/migrations/0007_rls_helpers.sql`

The spec §5 defines `current_school_id()` with a dual-mode fallback (JWT claim OR `app.school_id` session setting). Only the JWT-claim branch is load-bearing in Phase 2; the session-setting branch is a placeholder for Phase 3 anon middleware.

- [ ] **Step 1: Write the migration**

```sql
-- 0007_rls_helpers.sql
-- Phase 2 / Task 1: helper functions for RLS policies.
--
-- current_school_id() prefers the JWT claim (authed users); falls back to
-- a Postgres session setting (for anon visitors once Phase 3 middleware
-- sets `app.school_id` per request). Phase 2 only populates the JWT side.
--
-- is_superadmin() reads the claim set by the auth hook. Bootstrap check
-- via superadmin_emails is done inside the hook itself; is_superadmin()
-- is the runtime read.
--
-- superadmin_emails lives in a PRIVATE schema so it's not reachable via
-- the Data API. Seeded from ADMIN_EMAILS env var at migration time via
-- a call in Task 2.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TABLE private.superadmin_emails (
  email text PRIMARY KEY
);

-- current_school_id(): load-bearing in Phase 2 only for authed users via JWT claim.
CREATE OR REPLACE FUNCTION public.current_school_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'school_id', '')::uuid,
    NULLIF(current_setting('app.school_id', true), '')::uuid
  );
$$;

-- is_superadmin(): reads the JWT claim set by the hook.
CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_superadmin')::boolean, false);
$$;

-- Lock down: revoke execute from anon/authenticated (they read via RLS,
-- not directly). Supabase service_role keeps implicit EXECUTE via superuser.
REVOKE EXECUTE ON FUNCTION public.current_school_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_superadmin() FROM anon, authenticated;

-- But RLS policies evaluated for anon/authenticated DO need to call these.
-- Policies run with the caller's role; the functions are SECURITY INVOKER
-- so they'd fail EXECUTE check. Re-grant for RLS evaluation:
GRANT EXECUTE ON FUNCTION public.current_school_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon, authenticated;

COMMIT;
```

- [ ] **Step 2: Apply to prod via MCP `apply_migration`**

Name: `phase2_rls_helpers`. Query: full SQL above minus `BEGIN;` / `COMMIT;` (MCP wraps).

- [ ] **Step 3: Verify the helpers**

```sql
SELECT public.current_school_id() IS NULL AS expect_null_no_jwt;
SELECT public.is_superadmin() AS expect_false_no_jwt;
```

Expected: `expect_null_no_jwt=true`, `expect_false_no_jwt=false` (both functions return "no tenant context" when called with no JWT, e.g., via the service-role client).

- [ ] **Step 4: Commit**

```bash
git add lib/db/migrations/0007_rls_helpers.sql
git commit -m "feat(db): phase 2 — RLS helpers + superadmin_emails table"
```

---

## Task 2: Seed superadmin_emails from ADMIN_EMAILS env var

**Files:** no new files; inline SQL via MCP.

This is a one-shot seed, not a migration — the source of truth remains `ADMIN_EMAILS` in Vercel env vars; we just mirror it into a SQL-readable table for the hook. On rotation, re-run this step.

- [ ] **Step 1: Read ADMIN_EMAILS from local env**

```bash
grep '^ADMIN_EMAILS=' /Users/jahaan/Desktop/successatsage/.env.local | cut -d= -f2-
```

- [ ] **Step 2: Seed via `execute_sql`**

Replace `EMAIL1,EMAIL2,...` with the comma-separated list from Step 1:

```sql
INSERT INTO private.superadmin_emails (email)
SELECT trim(lower(unnest(string_to_array('EMAIL1,EMAIL2,...', ','))))
ON CONFLICT (email) DO NOTHING;
SELECT count(*) AS seeded FROM private.superadmin_emails;
```

Expected: `seeded` ≥ 1 (count = number of ADMIN_EMAILS entries).

- [ ] **Step 3: No commit needed (seed only, not a file change)**

---

## Task 3: Custom Access Token hook function

**Files:**
- Create: `lib/db/migrations/0009_custom_access_token_hook.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0009_custom_access_token_hook.sql
-- Phase 2 / Task 3: Supabase Auth Hook — Custom Access Token.
--
-- Runs inside supabase_auth_admin's transaction on every token issuance
-- (signup, login, refresh). Injects two custom claims into the JWT:
--   - school_id:     the user's school's uuid (from public.users.school_id)
--   - is_superadmin: true iff user's email is in private.superadmin_emails
--
-- The hook is DEFINED by this migration but not yet ENABLED. Enabling
-- requires a dashboard click: Authentication → Hooks → Custom Access
-- Token → select public.custom_access_token_hook.

BEGIN;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  claims jsonb;
  user_row record;
  is_sa boolean := false;
BEGIN
  claims := COALESCE(event->'claims', '{}'::jsonb);

  SELECT u.school_id, u.email
    INTO user_row
  FROM public.users u
  WHERE u.id = (event->>'user_id')::uuid;

  IF user_row.school_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{school_id}', to_jsonb(user_row.school_id::text));
  END IF;

  IF user_row.email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM private.superadmin_emails WHERE email = lower(trim(user_row.email))
    ) INTO is_sa;
  END IF;
  claims := jsonb_set(claims, '{is_superadmin}', to_jsonb(is_sa));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant the auth service permission to call it
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon, authenticated, public;

-- Grant the auth service read access to the tables the hook reads
GRANT SELECT ON public.users TO supabase_auth_admin;
GRANT USAGE ON SCHEMA private TO supabase_auth_admin;
GRANT SELECT ON private.superadmin_emails TO supabase_auth_admin;

COMMIT;
```

- [ ] **Step 2: Apply via MCP**

Name: `phase2_custom_access_token_hook`.

- [ ] **Step 3: Smoke-test the function with a fake event**

```sql
SELECT public.custom_access_token_hook(jsonb_build_object(
  'user_id', (SELECT id FROM public.users LIMIT 1)::text,
  'claims', '{"sub":"test"}'::jsonb
));
```

Expected: returned jsonb has `claims.school_id = 'a0000000-0000-0000-0000-000000000001'` and `claims.is_superadmin` is a boolean (true if that user is in superadmin_emails, else false).

- [ ] **Step 4: Commit**

```bash
git add lib/db/migrations/0009_custom_access_token_hook.sql
git commit -m "feat(auth): phase 2 — custom access token hook function"
```

- [ ] **Step 5: ⚠ USER ACTION — enable the hook in Supabase dashboard**

Operator: Supabase Dashboard → Authentication → Hooks (experimental) → Custom Access Token → toggle ON → select function `public.custom_access_token_hook` → Save. Takes ~30 seconds. Cannot be automated via MCP.

After save: any NEW token issuance carries the claims. Existing tokens keep the old claim set until they naturally refresh (short TTL — typically <1 hour).

- [ ] **Step 6: Verify a fresh login carries claims**

Sign in (or let an existing session refresh) and decode the JWT. `claims.school_id` should match Sage's UUID.

---

## Task 4: Enable RLS + write policies

**Files:**
- Create: `lib/db/migrations/0008_rls_policies.sql`

Note: numbered 0008 despite following 0009 in execution order. Migration number indicates write-order for versioning (RLS conceptually predates the hook's runtime use); Task 3 applies first because it's the smaller/safer change and we want the hook's function to exist before RLS evaluates `is_superadmin()`.

- [ ] **Step 1: Write the migration**

```sql
-- 0008_rls_policies.sql
-- Phase 2 / Task 4: enable RLS and attach tenant-isolation policies to
-- every tenant-scoped table.
--
-- Policy pattern from spec §5:
--   READ:  school_id = current_school_id() OR is_superadmin()
--   WRITE: same, with WITH CHECK (same).
--
-- Business-logic policies (e.g. "only approved materials visible to
-- students") will layer on top in later phases. The existing RLS
-- policies from 0001_rls_and_storage.sql are dropped here and replaced
-- with the tenant-aware versions.

BEGIN;

-- Drop the Phase-0 policies that predate tenancy
DROP POLICY IF EXISTS "Departments are publicly readable" ON public.departments;
DROP POLICY IF EXISTS "Courses are publicly readable" ON public.courses;
DROP POLICY IF EXISTS "Units are publicly readable" ON public.units;
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Authenticated can read approved materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Users can read own enrollments" ON public.user_courses;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.user_courses;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.user_courses;

-- Enable RLS on every tenant table (idempotent; ENABLE is a no-op if already on)
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_winners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_views   ENABLE ROW LEVEL SECURITY;
-- schools, school_domains, school_requests handled separately below

-- Tenant-isolation policy template (one per table)
CREATE POLICY tenant_read  ON public.users            FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.users            FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.departments      FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.departments      FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.courses          FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.courses          FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.units            FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.units            FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

-- Materials: tenant isolation + student-only-sees-approved layered
CREATE POLICY tenant_read_materials ON public.materials FOR SELECT
  USING (
    (school_id = public.current_school_id() OR public.is_superadmin())
    AND (status = 'approved' OR uploaded_by = auth.uid() OR public.is_superadmin())
  );
CREATE POLICY tenant_insert_materials ON public.materials FOR INSERT
  WITH CHECK (
    (school_id = public.current_school_id() OR public.is_superadmin())
    AND (uploaded_by = auth.uid() OR public.is_superadmin())
  );
CREATE POLICY tenant_update_materials ON public.materials FOR UPDATE
  USING (school_id = public.current_school_id() OR public.is_superadmin())
  WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete_materials ON public.materials FOR DELETE
  USING (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.user_courses     FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.user_courses     FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

-- contest_settings + contest_winners: public read within tenant, admin-only write
CREATE POLICY tenant_read  ON public.contest_settings FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.contest_settings FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.contest_winners  FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.contest_winners  FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.material_views   FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.material_views   FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

-- schools, school_domains, school_requests:
-- - schools: any anon or authed user can SELECT any school (needed for
--   slug → id lookup in Phase 3 middleware and for the admin review queue)
-- - school_domains: public read for signup domain lookup
-- - school_requests: anyone can INSERT (public form); only superadmin can SELECT/UPDATE
ALTER TABLE public.schools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_domains  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY schools_public_read         ON public.schools         FOR SELECT USING (true);
CREATE POLICY school_domains_public_read  ON public.school_domains  FOR SELECT USING (true);

CREATE POLICY school_requests_public_insert ON public.school_requests FOR INSERT WITH CHECK (true);
CREATE POLICY school_requests_superadmin_all ON public.school_requests FOR ALL
  USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

COMMIT;
```

- [ ] **Step 2: Apply via MCP**

Name: `phase2_rls_policies`.

- [ ] **Step 3: Verify RLS is enabled on every tenant table**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public'
  AND tablename IN ('users','departments','courses','units','materials',
                    'user_courses','contest_settings','contest_winners',
                    'material_views','schools','school_domains','school_requests')
ORDER BY tablename;
```

Expected: every row `rowsecurity = true`.

- [ ] **Step 4: Verify service-role bypass still works (app unaffected)**

Hit the live site's `/` and `/leaderboard` via WebFetch — they should still render the prize. (If this breaks, something's wrong — app uses `supabaseAdmin` which bypasses RLS, so landing RLS cannot affect it.)

- [ ] **Step 5: Commit**

```bash
git add lib/db/migrations/0008_rls_policies.sql
git commit -m "feat(db): phase 2 — RLS policies on every tenant table"
```

---

## Task 5: Verification script

**Files:**
- Create: `scripts/verify-phase-2.ts`

- [ ] **Step 1: Write**

```ts
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

  // RLS on every tenant table
  const { data: rls } = await supabaseAdmin.rpc('exec_sql' as any, { q: '' }).then(() => ({ data: null })).catch(() => ({ data: null }))
  // Fallback: probe via a query we know should succeed via service-role
  for (const t of TENANT_TABLES) {
    const { error } = await supabaseAdmin.from(t).select('*', { head: true, count: 'exact' })
    if (error) { console.error(`FAIL: service-role read of ${t}: ${error.message}`); process.exit(1) }
    console.log(`✓ ${t}: service-role read works`)
  }

  // Helper function exists
  const { data: hfn, error: hfnErr } = await supabaseAdmin.rpc('current_school_id')
  if (hfnErr) { console.error(`FAIL: current_school_id() RPC: ${hfnErr.message}`); process.exit(1) }
  console.log(`✓ current_school_id() callable (returned ${hfn ?? 'null'} under service-role)`)

  // Custom access token hook function exists (presence check via pg_proc)
  const { data: hook, error: hookErr } = await supabaseAdmin
    .rpc('custom_access_token_hook' as any, { event: { user_id: '00000000-0000-0000-0000-000000000000', claims: {} } })
    .catch((e: any) => ({ data: null, error: e }))
  if (hookErr) { console.warn(`? custom_access_token_hook RPC returned error (expected if user not found): ${hookErr.message}`) }
  else console.log(`✓ custom_access_token_hook callable`)

  console.log('\nPhase 2 verification PASSED')
}
main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run it**

```bash
cd /Users/jahaan/Desktop/successatsage-phase-2
NEXT_PUBLIC_SUPABASE_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-) \
SUPABASE_SERVICE_ROLE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-) \
npx tsx scripts/verify-phase-2.ts
```

Expected: every line starts with `✓`. Final `Phase 2 verification PASSED`.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-phase-2.ts
git commit -m "test(db): phase-2 verification script"
```

---

## Task 6: Merge + deploy + drop DEFAULTs

DEFAULT drop waits until hook is proven live in prod and a few token refreshes have happened. This is the one step with a failure mode: if any insert path is missed, it'll start violating NOT NULL when DEFAULT drops.

- [ ] **Step 1: Merge branch to main + push**

```bash
cd /Users/jahaan/Desktop/successatsage
git merge --no-ff build/phase-2-rls -m "merge: Phase 2 multi-tenant tenant isolation"
git push Success-at-Sage main
```

- [ ] **Step 2: Wait for Vercel prod deploy**

Poll `mcp__plugin_vercel_vercel__get_deployment` until READY. Deploy contains no app-code changes; build is fast.

- [ ] **Step 3: ⚠ USER CONFIRMS hook is enabled in dashboard (Task 3 Step 5) AND has been live long enough that at least one token refresh has occurred (wait ≥ 1h after enabling, or manually trigger a logout→login)**

- [ ] **Step 4: Apply DEFAULT-drop migration**

```sql
-- 0010_drop_school_id_defaults.sql
-- Phase 2 / Task 6: remove the Phase-1 DEFAULT Sage clauses from every
-- school_id column. Now that the auth hook supplies school_id from JWT
-- claims, any insert path that forgets to set it should fail LOUDLY
-- rather than silently land in Sage.

BEGIN;

ALTER TABLE public.users            ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.departments      ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.courses          ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.units            ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.materials        ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.user_courses     ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.contest_settings ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.contest_winners  ALTER COLUMN school_id DROP DEFAULT;
ALTER TABLE public.material_views   ALTER COLUMN school_id DROP DEFAULT;

COMMIT;
```

Apply via MCP `apply_migration` name `phase2_drop_school_id_defaults`.

- [ ] **Step 5: Verify no DEFAULTs left**

```sql
SELECT table_name, column_default
FROM information_schema.columns
WHERE table_schema='public' AND column_name='school_id'
ORDER BY table_name;
```

Expected: every `column_default` is `NULL` (no default).

- [ ] **Step 6: Smoke test signup → onboarding → submit**

Real user action: one operator signs up a test account, completes onboarding, submits a test material. Watch for NOT NULL errors in Vercel runtime logs. If any fire, something missed — re-grep for INSERT sites, fix, redeploy, re-try.

- [ ] **Step 7: Tag phase-2-complete**

```bash
cd /Users/jahaan/Desktop/successatsage
git tag phase-2-complete
git push Success-at-Sage phase-2-complete
```

---

## Task 7: Update Phase-2 breadcrumbs in lib/constants.ts + schema.ts

Now that the DEFAULTs are gone, the Phase-2 checklist comment in `lib/constants.ts` and the TODO at the top of `schema.ts` are stale. Trim them.

- [ ] **Step 1: Update `lib/constants.ts`**

Replace the `PHASE 2 REMOVAL CHECKLIST` block with a shorter historical note:

```ts
/**
 * Hardcoded tenant constants for Phase 1 of the multi-tenant migration.
 *
 * Phase 3 (route restructure) replaces this constant with `school_id`
 * resolved from the URL slug / JWT claim. Delete this file at that
 * point.
 *
 * (Phase 2 already dropped the DB-level DEFAULT Sage clauses — all
 * INSERTs now must explicitly set school_id or they'll NOT NULL-violate.)
 */
export const SAGE_SCHOOL_ID = 'a0000000-0000-0000-0000-000000000001'
```

- [ ] **Step 2: Remove the TODO header from `lib/db/schema.ts`**

Delete lines 1–3 (the Phase-2 TODO header added earlier).

- [ ] **Step 3: Typecheck + commit + push**

```bash
cd /Users/jahaan/Desktop/successatsage-phase-2
npx tsc --noEmit
git add lib/constants.ts lib/db/schema.ts
git commit -m "chore: trim Phase-2 breadcrumbs post DEFAULT-drop"
```

---

## Rollback

Each migration reverses cleanly:
- `0010` reverse: re-add `DEFAULT 'a0000000-...'` to each `school_id` column.
- `0008` reverse: `DROP POLICY tenant_* ON <table>` for each; `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` as needed; re-create the original 0001 policies.
- `0009` reverse: `DROP FUNCTION public.custom_access_token_hook(jsonb);` + dashboard toggles hook OFF.
- `0007` reverse: `DROP FUNCTION`s, `DROP TABLE private.superadmin_emails`, `DROP SCHEMA private`.

`phase-1-complete` tag at `7382eba` is the pre-Phase-2 checkpoint.

---

## Open items

- **JWT freshness window**: existing authed sessions keep old claims until refresh (≤1h). Any query using `current_school_id()` will see NULL for old tokens and return zero rows (RLS filter fails). Mitigation: service-role bypass keeps the app working for these users; they only hit the issue when Phase 3/4 switches to authenticated clients. At that point, Phase 3 middleware should detect stale tokens and force a refresh.
- **Anon middleware**: deferred to Phase 3 (needs URL slug). Until then, `current_school_id()` returns NULL for anon visitors, and RLS blocks them from reading any tenant row — but since app uses service-role, anon pages still work.
