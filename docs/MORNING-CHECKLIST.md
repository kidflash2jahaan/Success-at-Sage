# Morning checklist — multi-tenant migration

Everything that could be automated is done. Below is everything that still needs you.

## Status at a glance

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Schema | ✅ live | `phase-1-complete` |
| Phase 2 — RLS + auth hook | ✅ live (hook not yet enabled in dashboard) | `phase-2-complete` |
| Phase 3 — `/s/[schoolSlug]/` routes | ✅ live | `phase-3-complete` |
| Phase 4 — Multi-tenant signup + request-school + contest toggle | ✅ live | `phase-4-complete` |
| Phase 4b — Superadmin queue + impersonation + perf pass | ✅ live | `phase-4b-complete` |
| Phase 5 — Domain cutover | ⏸ waiting on you (domain purchase) | — |

## What you need to do

### 1. Enable the Supabase Custom Access Token hook (2 minutes, one-time)

Supabase dashboard → Authentication → Hooks (experimental) → **Custom Access Token** → toggle ON → select function `public.custom_access_token_hook` → Save.

After this, all new-issued JWTs carry `school_id`, `is_superadmin`, and `pending_school_admin_for` claims. Existing sessions pick up the claims on their next token refresh (≤1h).

### 2. Enable Supabase leaked-password protection (30 seconds, optional but advisor-flagged)

Supabase dashboard → Authentication → Providers → Email → toggle "Protect your users from leaked passwords".

### 3. Pick a domain name (30 seconds)

All four "success at…" variants are available at **$11.25/year** through Vercel:

- `successaths.com` — spec's original (ambiguous spelling flagged earlier)
- `successathighschool.com` — unambiguous, long
- `successatschools.com` — unambiguous, short
- `successath.com` — very short, ambiguous

Purchase: https://vercel.com/domains/search?q=YOUR_CHOICE_HERE

### 4. Add the domain to the Vercel project (2 minutes)

If you buy through Vercel's registrar, DNS is auto-configured. If elsewhere: Vercel dashboard → success-at-sage → Settings → Domains → Add Domain.

### 5. Flip the switch — set `PRIMARY_DOMAIN` env var + redeploy

```bash
cd /Users/jahaan/Desktop/successatsage
vercel env add PRIMARY_DOMAIN production
# Enter: successaths.com   (or whichever you chose)
vercel --prod
```

The Phase-5 stub I committed in `next.config.ts` reads `PRIMARY_DOMAIN` and, once set, issues a permanent 301 from `successatsage.com/*` → `<new-domain>/s/sage/*`. No code change needed — env var is the switch.

### 6. Update Supabase Auth redirect URL allowlist

Supabase dashboard → Authentication → URL Configuration → Redirect URLs — add:
- `https://<new-domain>/**`
- `https://<new-domain>/auth/callback`
- `https://www.<new-domain>/**`

### 7. Regenerate marketing OG assets (optional, one-time)

Logged in as the superadmin, visit:
- `https://<new-domain>/s/sage/og/ig-launch?download=1`
- `https://<new-domain>/s/sage/og/ig-leaderboard?download=1`
- `https://<new-domain>/s/sage/og/ig-winner?download=1`
- `https://<new-domain>/s/sage/og/poster-stall?download=1`
- `https://<new-domain>/s/sage/og/poster-door?download=1`

## What shipped overnight

Across **25 commits** and **15 SQL migrations** on `main`:

### Phase 1 — Schema foundation
3 tenant-management tables (`schools`, `school_domains`, `school_requests`); `school_id` on 9 tenant-scoped tables with composite FKs; `contest_settings` PK reshape from `id=1` singleton to `school_id`.

### Phase 2 — RLS + auth hook
Custom Access Token hook function, `current_school_id()` + `is_superadmin()` helpers, RLS policies on all 12 public tables, `private.superadmin_emails` seeded from `ADMIN_EMAILS`. DEFAULT Sage clauses DROPPED — all inserts now fail-loud on missing `school_id`.

### Phase 3 — Route restructure
All tenant routes live under `/s/[schoolSlug]/`. Old flat paths 301 to `/s/sage/*`. Tenant layout resolves slug → Tenant (404 on unknown slug).

### Phase 4 — Multi-tenant signup
Email-domain → tenant routing (no more hardcoded `@sagehillschool.org`). Public `/request-school` form. Contest toggle hides prize UI when `contest_enabled=false`.

### Phase 4b — Superadmin queue + polish
`/admin/schools` review queue (approve/reject + impersonation banner). `pending_school_admins` table + hook extension + promotion RPC for auto-promoting the requester on first login after approval. `SAGE_SCHOOL_ID` removed from all runtime app code (only in seed tooling). TopNav + Sidebar + all tenant pages use `useParams` / `params.schoolSlug` — zero cross-tenant nav leaks. `/auth/callback` resolves tenant from email domain.

### Phase 4b perf pass
Split every `tenant_write` FOR ALL policy into INSERT/UPDATE/DELETE (eliminates `multiple_permissive_policies` lint on 8 tables — each read was double-evaluating an unused SELECT policy). Wrapped materials `auth.uid()` calls in `(SELECT auth.uid())` for init-plan lift. Added 15 FK indexes for tenant-scoped lookups.

### Phase 5 stub
`next.config.ts` has a `PRIMARY_DOMAIN`-gated host-based 301 ready to flip on domain purchase. No code change needed to activate — set the env var and redeploy.

## Rollback checkpoints (all pushed to GitHub)

- `v-pre-multi-tenant` — before any migration work
- `phase-1-complete` — schema foundation only
- `phase-2-complete` — + RLS + hook + DEFAULT drop
- `phase-3-complete` — + route restructure
- `phase-4-complete` — + multi-tenant signup
- `phase-4b-complete` — + superadmin queue + perf pass

Any emergency: `git checkout <tag-name>` in `/Users/jahaan/Desktop/successatsage`, then `git push --force-with-lease Success-at-Sage main`. Vercel auto-deploys the rollback. DB rollback requires matching migration reverses — see each plan file's Rollback section.

## Plans committed to the repo (for reference)

- `docs/superpowers/plans/2026-04-21-phase-1-schema-foundation.md`
- `docs/superpowers/plans/2026-04-21-phase-2-rls-and-auth-hook.md`
- `docs/superpowers/plans/2026-04-21-phase-3-route-restructure.md`
- `docs/superpowers/plans/2026-04-21-phase-4-signup-and-superadmin.md`
- `docs/superpowers/plans/2026-04-21-phase-5-domain-cutover.md`

## Verification scripts

- `scripts/verify-phase-1.ts` — 21 schema invariants
- `scripts/verify-phase-2.ts` — RLS + helper function checks

Run both: `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/verify-phase-N.ts`

## Final smoke-test results (just before I handed off)

All 13 paths return correct redirects/pages:
- `/` → `/s/sage`
- `/leaderboard` → `/s/sage/leaderboard`
- `/s/sage` + `/s/sage/leaderboard` → direct
- `/s/oakwood` → 404 (unknown tenant)
- Auth-gated (`/dashboard`, `/admin/schools`, `/profile`, `/submit`) → `/login`
- `/request-school`, `/signup`, `/login` → direct
- `/og/ig-launch` → `/s/sage/og/ig-launch`

Landing page renders "$50 Amazon gift card" pulled from the reshaped `contest_settings` table keyed by `school_id`. Leaderboard pulls "Winner chosen on June 1, 2026" from the same.

All 12 tables have RLS enabled + tenant-scoped policies. All 9 tenant-scoped tables have `school_id NOT NULL` (no DEFAULT). 15 FK indexes cover composite FK lookups. Security advisors down to 2 intentional items. Perf advisors down from ~50 to just "unused_index" infos (Postgres hasn't accumulated usage stats yet — these aren't actionable today).
