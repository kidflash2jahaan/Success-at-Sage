# Morning checklist — multi-tenant migration

Everything that could be automated is done. Below is everything that still needs you.

## Status at a glance

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Schema | ✅ live | `phase-1-complete` |
| Phase 2 — RLS + auth hook | ✅ live, **hook not yet enabled in dashboard** | `phase-2-complete` |
| Phase 3 — Routes under `/s/[schoolSlug]/` | ✅ live | `phase-3-complete` |
| Phase 4 — Multi-tenant signup + request-school + contest toggle | ✅ live | `phase-4-complete` |
| Phase 4b — Superadmin review queue + impersonation + pending-admin promotion | ✅ live | `phase-4b-complete` |
| Phase 5 — Domain cutover | ⏸ waiting on you | — |

## What you need to do

### 1. Enable the Supabase Custom Access Token hook (2 minutes, one-time)

Supabase dashboard → Authentication → Hooks (experimental) → **Custom Access Token** → toggle ON → select function `public.custom_access_token_hook` → Save.

After this, all new-issued JWTs carry `school_id`, `is_superadmin`, and `pending_school_admin_for` claims. Existing sessions pick up the claims on their next token refresh (≤1h).

### 2. Enable Supabase leaked-password protection (30 seconds, recommended)

Supabase dashboard → Authentication → Providers → Email → toggle "Protect your users from leaked passwords". Flagged by Supabase's own security advisors.

### 3. Purchase the domain (5 minutes)

All four "success at…" variants are available at **$11.25/year** through Vercel:

- `successaths.com` — spec's original choice (ambiguous spelling flagged)
- `successathighschool.com` — unambiguous, long
- `successatschools.com` — unambiguous, short
- `successath.com` — very short, ambiguous

Purchase URL: https://vercel.com/domains/search?q=YOUR_CHOICE_HERE

### 4. Point the domain at Vercel (5 minutes, only if domain bought outside Vercel)

If purchased via Vercel registrar: DNS is auto-configured, skip to step 5.

If purchased elsewhere: Vercel dashboard → success-at-sage project → Settings → Domains → Add Domain → enter new domain → follow DNS instructions.

### 5. Set PRIMARY_DOMAIN env var + redeploy

```bash
cd /Users/jahaan/Desktop/successatsage
vercel env add PRIMARY_DOMAIN production
# Enter: successaths.com   (or whichever you bought)
vercel --prod
```

Once deployed, `successatsage.com/*` will 301 to `<new-domain>/s/sage/*`. Phase 5 is complete.

### 6. Update Supabase Auth redirect URL allowlist

Supabase dashboard → Authentication → URL Configuration → Redirect URLs → add:
- `https://<new-domain>/**`
- `https://<new-domain>/auth/callback`
- `https://www.<new-domain>/**`

### 7. Regenerate marketing OG assets (optional, one-time)

The printed posters + Instagram posts embed the URL. After step 5 is live, visit while logged in as superadmin:
- `https://<new-domain>/s/sage/og/ig-launch?download=1`
- `https://<new-domain>/s/sage/og/ig-leaderboard?download=1`
- `https://<new-domain>/s/sage/og/ig-winner?download=1`
- `https://<new-domain>/s/sage/og/poster-stall?download=1`
- `https://<new-domain>/s/sage/og/poster-door?download=1`

## What I did last night

All migrations (0002–0013) applied to prod. 4 worktree-driven merges: `phase-1-complete` (7382eba) → `phase-2-complete` (901138f → 4441e32) → `phase-3-complete` (0afd2b4) → `phase-4-complete` (6133e81) → `phase-4b-complete` (TBD). Every phase has its own implementation plan committed under `docs/superpowers/plans/2026-04-21-phase-N-*.md` and a verification script under `scripts/verify-phase-N.ts`.

Superadmin queue lives at `/admin/schools` (you, authenticated). Request-to-create form at `/request-school` (public). Impersonation flow sets an `impersonating_school` cookie and shows a persistent banner inside the tenant layout — cookie expires after 4h or on "exit".

If anything is broken in the morning, check `git log --oneline main -20` to see what shipped, or git-revert to a prior tag (`v-pre-multi-tenant`, `phase-1-complete`, … are all pushed to GitHub for rollback).

## Rollback tags (from github.com/kidflash2jahaan/Success-at-Sage)

- `v-pre-multi-tenant` — before any migration work
- `phase-1-complete` — schema foundation only
- `phase-2-complete` — + RLS + hook
- `phase-3-complete` — + route restructure
- `phase-4-complete` — + multi-tenant signup
- `phase-4b-complete` — + superadmin queue
