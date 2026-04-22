# Phase 4 — Signup Flows + Superadmin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A global signup form that routes new users to their school by email domain. A `/request-school` form that anyone can submit. A `/admin/schools` superadmin queue for reviewing/approving requests. An `/admin/impersonate/<slug>` flow for the superadmin to enter any tenant. Contest toggle enforced: `contest_enabled=false` hides the prize UI but keeps the leaderboard.

**Architecture:** Global `/signup` form does email → domain → school lookup. If no school matches, redirect to `/request-school?email=<email>`. Approving a request runs a DB transaction that creates the `schools` row, inserts the requester's email domain into `school_domains`, and flags the requester's email in a bootstrap list so when they sign up they're auto-promoted to admin of the new school. Contest-toggle enforcement is a conditional at every prize-display site.

**Spec:** `docs/superpowers/specs/2026-04-21-multi-tenant-design.md` §7.
**Base:** `phase-3-complete`.

---

## File manifest

**Create:**
- `app/request-school/page.tsx` — public form
- `app/request-school/page.client.tsx` — form component
- `app/actions/request-school.ts` — server action inserting into `school_requests`
- `app/(superadmin)/admin/schools/page.tsx` — review queue
- `app/(superadmin)/admin/schools/[id]/page.tsx` — review detail
- `app/(superadmin)/admin/impersonate/[slug]/route.ts` — sets cookie, redirects
- `app/actions/superadmin.ts` — approve/reject/impersonate server actions
- `lib/db/migrations/0012_pending_school_admins.sql` — bootstrap table: emails that will become school admins on signup
- `lib/superadmin.ts` — guard helper (`requireSuperadmin()`)

**Modify:**
- `app/(auth)/signup/page.tsx` and `app/actions/signup.ts` — email-domain routing, no hardcoded `@sagehillschool.org` check. Use `resolveTenantByEmail()` from Phase 3.
- `app/(auth)/login/page.tsx` — on successful login, redirect to `/s/<their-slug>/dashboard` via JWT-claim-derived slug.
- `app/actions/auth.ts` (`completeOnboarding`) — look up tenant by email domain; set `school_id` accordingly. Promote to admin if email is in `pending_school_admins`.
- `middleware.ts` — add superadmin impersonation cookie read
- `app/s/[schoolSlug]/layout.tsx` — honor impersonation cookie (superadmin can view any tenant)
- Contest-display sites (5 files): landing, leaderboard, dashboard, submit, admin/contest — wrap prize display in `if (tenant.contestEnabled)`.

---

## Task 0: Pre-flight

Same pattern: worktree from `phase-3-complete`.

---

## Task 1: `pending_school_admins` table

**Files:**
- Create: `lib/db/migrations/0012_pending_school_admins.sql`

```sql
BEGIN;
CREATE TABLE private.pending_school_admins (
  email text NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (email, school_id)
);
GRANT SELECT, INSERT, DELETE ON private.pending_school_admins TO supabase_auth_admin;
COMMIT;
```

Apply via MCP. Commit.

---

## Task 2: Extend auth hook to check pending_school_admins

Update `public.custom_access_token_hook` to also set a `pending_school_admin` claim (or: on first token issuance for a pending admin, promote them to `role='admin'` and remove from pending list).

**Approach A — claim-only (safer):**
- Hook sets `pending_school_admin_for = <school_uuid>` if email matches
- `completeOnboarding` reads this, promotes to admin, deletes from pending

**Approach B — hook mutates users table (riskier, avoid):**
- Don't do this; hooks should be read-only.

Go with Approach A.

```sql
-- Extend custom_access_token_hook
-- Add after the is_superadmin branch:
DECLARE pending_sid uuid;
BEGIN
  SELECT school_id INTO pending_sid FROM private.pending_school_admins
  WHERE email = lower(trim(user_row.email)) LIMIT 1;
  IF pending_sid IS NOT NULL THEN
    claims := jsonb_set(claims, '{pending_school_admin_for}', to_jsonb(pending_sid::text));
  END IF;
END;
```

---

## Task 3: Request-to-create form

`/request-school` — public anon form. Fields: name, email, role, proposed school name, display short, slug, domains (comma-separated), notes. Server action inserts into `school_requests`.

```tsx
// app/request-school/page.tsx  (server component)
import { requestSchool } from '@/app/actions/request-school'
export default function RequestSchool() {
  return <form action={requestSchool}>...</form>
}
```

```ts
// app/actions/request-school.ts
'use server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function requestSchool(formData: FormData) {
  const domains = (formData.get('domains') as string).split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
  const { error } = await supabaseAdmin.from('school_requests').insert({
    proposed_slug: formData.get('proposed_slug'),
    proposed_name: formData.get('proposed_name'),
    proposed_display_short: formData.get('proposed_display_short'),
    proposed_domains: domains,
    requester_name: formData.get('requester_name'),
    requester_email: (formData.get('requester_email') as string).toLowerCase(),
    requester_role: formData.get('requester_role'),
    notes: formData.get('notes'),
  })
  if (error) redirect('/request-school?error=1')
  redirect('/request-school/thanks')
}
```

---

## Task 4: Superadmin review queue

`/admin/schools` — lists all `school_requests` ordered by status then created_at. Click-through to detail page.

`/admin/schools/[id]` — shows proposal + approve/reject buttons. Approve runs a transaction:
1. `INSERT INTO schools (slug, name, display_short) VALUES (...)`
2. `INSERT INTO school_domains` for each domain
3. `INSERT INTO private.pending_school_admins (email, school_id)` for the requester
4. `UPDATE school_requests SET status='approved', reviewed_by=auth.uid(), reviewed_at=now()`

All wrapped in a server action calling a single SQL function for atomicity.

---

## Task 5: Signup flow rewrite

Replace hard-coded `@sagehillschool.org` in `app/actions/signup.ts` with:

```ts
const tenant = await resolveTenantByEmail(email)
if (!tenant) redirect(`/request-school?email=${encodeURIComponent(email)}`)
// proceed with signup, set school_id: tenant.id
```

---

## Task 6: Impersonation

`/admin/impersonate/<slug>` (superadmin guard) sets a cookie `impersonating_school=<slug>` + redirects to `/s/<slug>/dashboard`. The tenant layout reads the cookie and (if present + user is superadmin) uses that slug instead of the URL slug for tenant resolution.

Show a persistent "Impersonating: Oakwood (exit)" banner in the layout.

---

## Task 7: Contest toggle enforcement

Wrap every prize display in `if (tenant.contestEnabled)`:

```tsx
{tenant.contestEnabled && (
  <div className="prize-banner">Prize: {prize}</div>
)}
```

Leaderboard itself always shows (community ranking works independently).

---

## Task 8: Tests + verification

- Fake a second school via direct DB insert. Sign up with its domain. Verify routed to that tenant.
- Test superadmin impersonation: login as kidflash2jahaan, visit `/admin/impersonate/test-school`, verify banner shows + data is for test-school.
- Test `/request-school`: submit a request, verify it appears in `/admin/schools`.
- Test approval flow end-to-end.

---

## Rollback

Git revert merge commit. Drop `private.pending_school_admins`. Reset hook function to Phase-2 version.
