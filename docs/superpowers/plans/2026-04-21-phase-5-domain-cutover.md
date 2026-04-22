# Phase 5 — Domain Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `successaths.com` is the primary production domain. `successatsage.com` 301s forever to `successaths.com/s/sage/*`. All marketing references the new domain. Supabase Auth redirect URLs include `successaths.com`. Analytics continuity preserved by keeping the old domain's Vercel deployment wired up just for the redirect.

**Architecture:** Purchase `successaths.com` (or confirm chosen spelling). Add as Vercel domain alongside `successatsage.com`. Add 301 rewrites in `vercel.ts` / `next.config.ts`. Update env vars + Supabase Auth settings. Regenerate OG images via `/admin/og/` routes so they embed the new URL.

**Spec:** `docs/superpowers/specs/2026-04-21-multi-tenant-design.md` §9.
**Base:** `phase-4-complete`.

---

## ⚠ User-action boundary

This phase contains multiple hard user-action dependencies that cannot be automated via MCP:

1. **Purchase `successaths.com`** — requires a domain registrar account + payment. 30 min of user time.
2. **Add domain to Vercel project** — dashboard action (could possibly be done via Vercel API but risky without UI visibility).
3. **Update Supabase Auth redirect URL allowlist** — dashboard action.
4. **Update Vercel env var `NEXT_PUBLIC_SITE_URL`** — can be done via Vercel MCP or CLI.

Phases of this plan explicitly mark which steps are user-gated.

---

## Spec note: domain name

The spec flags that `successaths.com` spelling is ambiguous between "Success at HS" and other parses. **Before purchasing**, reconsider: the user previously accepted the name, but this is the last easy chance to change. Alternatives:
- `successathighschool.com` (unambiguous, long)
- `studentsuccessnetwork.com` (generic)
- Keep `successatsage.com` and forgo the rebrand (option: flagship-only, skip Phase 5 entirely)

If a different name is chosen, update this plan accordingly.

---

## File manifest

**Modify:**
- `next.config.ts` — add `successatsage.com/*` → `successaths.com/s/sage/*` redirect rule
- `app/page.tsx` — update visible domain references
- `README.md`, marketing copy files under `marketing/` — update references
- Vercel env vars (via `vercel env`): `NEXT_PUBLIC_SITE_URL`, any OG absolute URL bases

---

## Task 1: Decide on final domain name

- [ ] **Step 1: USER decides between `successaths.com` and alternatives**

Confirm or change. If changed, update Task 2's purchase target + this plan's references.

---

## Task 2: Purchase domain (USER action)

- [ ] **Step 1: Purchase `successaths.com` (or chosen alternative) from Namecheap / Cloudflare / GoDaddy**
- [ ] **Step 2: In registrar, point DNS at Vercel nameservers OR add Vercel's CNAME/A records**

Time estimate: 10–30 minutes depending on DNS propagation.

---

## Task 3: Add domain to Vercel project

- [ ] **Step 1: Vercel dashboard → Project → Settings → Domains → Add Domain → `successaths.com` and `www.successaths.com`**

Alternative: `vercel domains add successaths.com` via CLI (user-executed).

Vercel auto-verifies via DNS.

---

## Task 4: 301 redirect from old to new

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add domain-scoped redirect**

```ts
async redirects() {
  return [
    // Permanent redirect from old brand domain to new
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'successatsage.com' }],
      destination: 'https://successaths.com/s/sage/:path*',
      permanent: true,
    },
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.successatsage.com' }],
      destination: 'https://successaths.com/s/sage/:path*',
      permanent: true,
    },
    // Phase-3 path redirects remain (already in place)
    ...existingPhase3Redirects,
  ]
}
```

- [ ] **Step 2: Commit + deploy**

---

## Task 5: Update Supabase Auth redirect URLs

- [ ] **Step 1 (USER): Supabase Dashboard → Authentication → URL Configuration**

Add to "Redirect URLs" allowlist:
- `https://successaths.com/**`
- `https://successaths.com/auth/callback`
- `https://www.successaths.com/**`

Keep `successatsage.com` entries until cutover verified, then remove.

---

## Task 6: Update env vars

- [ ] **Step 1: `NEXT_PUBLIC_SITE_URL` in Vercel**

```bash
vercel env rm NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://successaths.com
```

- [ ] **Step 2: Trigger a redeploy so the new env takes effect**

```bash
vercel --prod
```

Or via Vercel MCP `deploy_to_vercel`.

---

## Task 7: Regenerate marketing OG assets

Since OG assets pull `NEXT_PUBLIC_SITE_URL` and now embed the new domain:

- [ ] Visit `/admin/og/ig-launch?download=1` etc. to regenerate Instagram posts + posters
- [ ] Print posters with the new URL

---

## Task 8: Verification

- [ ] `curl -I https://successatsage.com/dashboard` → 301 → `https://successaths.com/s/sage/dashboard`
- [ ] `https://successaths.com/` → generic landing (if Phase 3's generic landing is in place) or tenant landing
- [ ] Google Search Console: submit `successaths.com` as primary; `successatsage.com` marked as an alias (via 301 redirects this is automatic)
- [ ] Supabase Auth flows tested from both domains

---

## Task 9: Announce + monitor

Phase-5 post-deploy week:
- Monitor Vercel analytics for redirect volume
- Watch for broken inbound links from old marketing materials
- If anything breaks, check Vercel runtime logs + Supabase auth logs

---

## Rollback

If cutover goes badly:
- Remove `successaths.com` from Vercel → all traffic returns to `successatsage.com`
- Revert the `next.config.ts` redirect commit

Domain purchase is not reversible (keep it — it's cheap and the URL is valuable).

---

## Open items

- **Analytics continuity**: Vercel Analytics should handle the domain change automatically but session continuity may break. Acceptable.
- **Email deliverability**: transactional emails (Resend) currently use a domain linked to `successatsage.com`. Update the Resend domain settings after cutover, or wait for DNS records to update.
- **Marketing assets already printed**: posters, QR codes, etc., will keep working forever via the 301 redirect. No reprint needed.
