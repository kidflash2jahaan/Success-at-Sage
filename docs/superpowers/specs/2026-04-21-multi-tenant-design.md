# Multi-Tenant Migration — Design Spec

**Date:** 2026-04-21
**Project:** successatsage → successaths.com (Next.js 16 + Supabase)
**Status:** Approved (pending user review of this document)
**Checkpoint commit:** `29e1606` (tagged `v-pre-multi-tenant`)

---

## 1. Overview

Success at HS becomes a multi-tenant SaaS platform where every school is an isolated tenant. The Sage-specific brand is retired in favor of a generic parent brand at `successaths.com`; Sage becomes the flagship tenant at `successaths.com/s/sage`. The existing `successatsage.com` domain 301s to Sage's tenant URL to preserve printed posters, QR codes, and word-of-mouth distribution.

Architecturally: path-prefix URLs for tenants (`/s/<slug>/...`), email-domain routing at signup, per-school contest toggle, strict tenant isolation enforced by Postgres Row-Level Security with JWT-claim-based policies, and a request-to-create flow for onboarding new schools behind a superadmin review queue.

---

## 2. Decisions Grid

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Scope | **Full multi-tenant with signup flow** (not schema-only or soft-launch) | Goal is to eventually distribute to other schools publicly. |
| 2 | Routing | **Path-prefix** (`/s/<slug>/...`) | No DNS work; shareable anon URLs; upgrade to subdomains later is trivial. |
| 3 | Rebrand timing | **Now, bundled** | Other schools on `successatsage.com` is a brand mismatch; cleaner to cut once. |
| 3b | Parent domain | **`successaths.com`** | User's choice; spelling flagged as ambiguous but accepted. |
| 4 | School provisioning | **Request-to-create** (not self-serve, not admin-only) | Vetting without creating a manual bottleneck. |
| 5 | Signup mechanism | **Global signup, email-domain routing** | One global form; domain lookup determines school; URL-scoped signup deferred. |
| 6 | Data scoping | **Strict tenant isolation** | No shared catalog; each school has its own departments/courses/materials. |
| 7 | Admin model | **Two-tier: superadmin (env-var) + school admins (per-tenant)** | Reuses existing `ADMIN_EMAILS` pattern; superadmin approves school requests. |
| 8 | Per-school config | **Bare minimum + contest toggle** | Name, slug, domains, display-short, contest on/off. No per-school branding in v1. |
| 8b | Contest toggle scope | **Contest off hides prize; leaderboard stays** | Community ranking works independently of prize funding. |
| 9 | Tenant enforcement | **RLS at DB** | Defense-in-depth; missed filter = empty result, not data leak. |
| 10 | New school bootstrap | **Empty; user provides catalog to superadmin for one-off import** | No seed-data maintenance; concierge onboarding. |

---

## 3. Architecture at a Glance

```
Visitor → successaths.com
  │
  ├─ /                       → generic marketing landing (auth'd users auto-redirected to their school)
  ├─ /signup                 → global signup (email-domain routes to school)
  ├─ /login                  → global login (post-auth redirect to /s/<slug>/dashboard)
  ├─ /request-school         → anonymous form → superadmin review
  ├─ /admin/schools          → superadmin review queue (you only)
  ├─ /admin/impersonate/<slug> → superadmin entry point into any school
  └─ /s/<slug>/              → tenant-scoped routes
      ├─ /                   → tenant landing
      ├─ /leaderboard        → public (anon can view)
      ├─ /dashboard, /browse, /courses/[slug], /submit, /profile
      └─ /admin/              → school admin
          ├─ /contest
          └─ /submissions

successatsage.com/* → 301 → successaths.com/s/sage/*  (forever)
```

Three actor types, three access modes:

- **Anon** (logged-out visitor): can read public pages for the school whose slug appears in the URL. RLS enforces via Postgres session-level `app.school_id` set by middleware.
- **Authenticated student**: JWT carries `school_id` claim; RLS filters every query to that school only.
- **Superadmin**: JWT carries `is_superadmin=true`; RLS policies OR past tenant check — can see everything.

---

## 4. Schema Changes

### New tables

```sql
-- 4.1 schools: the tenant record
CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,                -- "sage"
  name text NOT NULL,                       -- "Sage Hill School"
  display_short text NOT NULL,              -- "Sage" → used in "Success at Sage"
  contest_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

-- 4.2 school_domains: email domains ↔ school (many-to-one, each domain globally unique)
CREATE TABLE school_domains (
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  domain text NOT NULL,                     -- normalized lowercase
  PRIMARY KEY (school_id, domain),
  UNIQUE (domain)
);

-- 4.3 school_requests: pending/reviewed create-school submissions
CREATE TYPE school_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE school_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_slug text NOT NULL,
  proposed_name text NOT NULL,
  proposed_display_short text NOT NULL,
  proposed_domains text[] NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_role text,                      -- "student" / "teacher" / "parent" / "other"
  notes text,                               -- free-text "tell us about your school"
  status school_request_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX school_requests_status_idx ON school_requests(status);
CREATE INDEX school_requests_requester_email_idx ON school_requests(requester_email);
```

### Modifications to existing tables

Every tenant-scoped table gains `school_id uuid NOT NULL REFERENCES schools(id)`:

- `users`
- `departments`
- `courses`
- `units`
- `materials`
- `user_courses`
- `contest_settings` — PK changes from `id` (singleton `id=1`) to `school_id` (one row per school); `id` column dropped.
- `contest_winners`

### Denormalization + composite FKs

`school_id` is **denormalized onto every tenant-scoped table** (not just derived via parent FK chain). Rationale: RLS policy becomes `USING (school_id = current_school_id())` — no JOINs to check tenancy. Query performance: `school_id` is the leading column of every index we care about.

Consistency enforced via composite foreign keys so a child row cannot reference a parent in a different school:

```sql
-- Composite FK example: materials → units must share school_id
ALTER TABLE units ADD UNIQUE (school_id, id);

ALTER TABLE materials
  ADD CONSTRAINT materials_unit_fk
  FOREIGN KEY (school_id, unit_id) REFERENCES units(school_id, id);
```

Same pattern for `courses→departments`, `units→courses`, `materials→users` (uploader), `user_courses→users`/`courses`, `contest_winners→users`.

---

## 5. RLS & Auth

### Helper functions

```sql
CREATE FUNCTION current_school_id() RETURNS uuid AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'school_id')::uuid,             -- authed user
    NULLIF(current_setting('app.school_id', true), '')::uuid  -- anon with URL context
  )
$$ LANGUAGE sql STABLE;

CREATE FUNCTION is_superadmin() RETURNS boolean AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_superadmin')::boolean, false)
$$ LANGUAGE sql STABLE;
```

### Policy template

```sql
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_read ON <table>
  FOR SELECT
  USING (school_id = current_school_id() OR is_superadmin());

CREATE POLICY tenant_isolation_write ON <table>
  FOR ALL
  USING (school_id = current_school_id() OR is_superadmin())
  WITH CHECK (school_id = current_school_id() OR is_superadmin());
```

Applied to every tenant-scoped table. Business-logic policies (e.g., only approved materials are visible to students) layer on top.

### JWT population via Supabase Auth Hook

A Postgres function runs on every token issuance. It:
1. Reads the user's `users` row (via `auth.uid()`).
2. Adds `school_id` as a custom claim (string form of their school's UUID).
3. Reads `ADMIN_EMAILS` via a `secrets` table (or env-var-backed function) and sets `is_superadmin = true` if the user's email matches.

Configured in Supabase dashboard: **Authentication → Hooks → Custom Access Token**.

### Anon session context (for public pages)

Middleware resolves `/s/<slug>/*` URLs to a `school_id` and calls `set_config('app.school_id', <uuid>, true)` on the Supabase DB session for the duration of the request. This is done via a server-side Supabase client wrapper that runs the `set_config` before any query. Anon clients inherit the setting; RLS reads it through `current_school_id()`.

### Superadmin impersonation

Route `/admin/impersonate/<slug>` (superadmin-only) sets a cookie `impersonating_school=<slug>` and redirects to `/s/<slug>/dashboard`. The cookie is read by the tenant resolver; queries use `<slug>`'s school_id for URL context. Superadmin JWT still has `is_superadmin=true`, so RLS bypass remains active. UI shows a persistent "Impersonating: Oakwood (exit)" banner.

---

## 6. Routing & Middleware

### Route map (Next.js App Router)

```
app/
├── layout.tsx                   # root layout
├── page.tsx                     # /  → generic marketing landing
├── (auth)/
│   ├── login/page.tsx           # /login
│   └── signup/page.tsx          # /signup
├── request-school/page.tsx      # /request-school
├── (superadmin)/
│   └── admin/
│       ├── layout.tsx           # superadmin guard
│       ├── schools/page.tsx     # /admin/schools
│       └── impersonate/[slug]/page.tsx
├── s/[schoolSlug]/              # ← all tenant routes move here
│   ├── layout.tsx               # resolves slug, sets Postgres session context
│   ├── page.tsx                 # tenant landing (was /)
│   ├── leaderboard/page.tsx     # (was /leaderboard)
│   ├── dashboard/page.tsx       # (was /(app)/dashboard)
│   ├── browse/page.tsx
│   ├── courses/[slug]/page.tsx
│   ├── submit/page.tsx
│   ├── profile/page.tsx
│   ├── onboarding/page.tsx
│   └── admin/
│       ├── contest/page.tsx
│       └── submissions/page.tsx
└── og/                          # OG routes ALSO move under /s/[schoolSlug]/og/*
```

### Middleware responsibilities

For every incoming request:

1. Parse URL. If it matches `/s/<slug>/...`:
   - Look up `school_id` by slug (cached in memory; slugs are immutable in v1).
   - If slug not found → rewrite to `/404`.
   - Set request header `x-school-id` for downstream page components to read.
   - Set Postgres session variable `app.school_id` on the anon Supabase client for RLS on anon reads.
2. Check auth state:
   - Logged-in user visiting their own tenant: normal render.
   - Logged-in user visiting a different tenant's public page: treat as anon for RLS (no cross-tenant token leak); render as anon would see it.
   - Logged-in user visiting a different tenant's auth-required page: redirect to their own tenant's equivalent path.
   - Superadmin: unrestricted.
3. Post-login redirect handling: `/login` success → look up `school_id` → redirect to `/s/<slug>/dashboard`.

Middleware is implemented in `middleware.ts` at repo root, matches `['/', '/s/:path*', '/admin/:path*', '/login', '/signup']`. Static assets bypass.

### Generic marketing landing at `/`

Logic:
- If user is logged in → redirect to `/s/<their-slug>/dashboard`.
- Otherwise → show generic "Success at HS — study notes platform for schools" with "find your school" search linking to `/signup`.

---

## 7. Signup & Request-to-Create Flows

### 7.1 Normal signup (existing school domain)

1. User visits `/signup`, fills form (name, email, password, graduating year).
2. Server action looks up `email's domain` in `school_domains`.
3. Found match:
   - Creates Supabase auth account.
   - Inserts `users` row with `school_id` from matched school.
   - If `requester_email` in a recently-approved `school_requests` row matches this email, sets `role='admin'` (first-admin promotion).
   - Otherwise `role='student'` (or `role='admin'` if email in `ADMIN_EMAILS` → preserves today's school-admin UX for bootstrapping superadmins on their home school). Note: `ADMIN_EMAILS` membership also confers the separate `is_superadmin=true` JWT claim via the auth hook (§5) — these are two independent signals, not the same thing.
   - Redirects to `/s/<slug>/onboarding` (or `/dashboard` if graduating year already provided).

### 7.2 Signup with unregistered domain

Server detects the domain is not in `school_domains`. Response:

- If the email looks school-ish (heuristic: `.edu` TLD, or `.org`/`.school`, or anything other than the major free-email providers): redirect to `/request-school?email=<their-email>&name=<their-name>` with a message "Your school isn't on the platform yet — want to request it?"
- If the email is a free-email provider (gmail, yahoo, etc.): reject with "Please sign up with your school email address." (Matches today's behavior for non-Sage emails.)

### 7.3 Request-to-create form (`/request-school`)

Fields:
- Your name (required)
- Your email (required, editable even if prefilled)
- Your role at the school (optional dropdown: student / teacher / parent / other)
- School name (required, e.g. "Oakwood School")
- Proposed URL slug (required, URL-safe, uniqueness validated live)
- Proposed display short-name (required, e.g. "Oakwood")
- Email domain(s) (required, multi-input)
- Tell us about your school (optional free-text)

On submit:
- Rate limit: one pending request per email address at a time; one request per email per 24h.
- Insert row into `school_requests` with `status='pending'`.
- Send notification email to superadmin (Resend or Supabase Email).
- Show confirmation: "We'll review and email you within a few days."

### 7.4 Superadmin review (`/admin/schools`)

Three tabs: **Pending** / **Approved** / **Rejected**.

Each pending row shows all request fields + three actions:

- **Approve (with optional edits)** — modal lets superadmin edit slug / name / display_short / domains before creation. On confirm:
  - Insert `schools` row.
  - Insert `school_domains` rows for each proposed domain.
  - Mark request `approved`, record `reviewed_by`, `reviewed_at`.
  - Send approval email to `requester_email` with signup link: `https://successaths.com/signup?from=approved`.

- **Reject** — modal asks for optional public reason. On confirm:
  - Mark request `rejected`, record `reviewed_by`, `reviewed_at`, `review_note`.
  - Send polite rejection email with reason.

- **Edit + Approve** is the primary path; the requester's slug/name may need cleanup.

### 7.5 First-admin promotion

When the approved requester later signs up (at `/signup` with their approved email), the signup server action (the same one described in §7.1) checks `school_requests` for a matching `requester_email` with `status='approved'` and created within the last 30 days. Match → inserts the new `users` row with `role='admin'`. Otherwise default `role='student'`.

This is purely a users-row assignment at insert time — the auth hook (§5) reads whatever role is on the row and passes it through to the JWT; it does not compute first-admin on its own.

---

## 8. Data Migration

Runs against the Supabase DB preview branch. Production is untouched until final merge.

### 8.1 Pre-migration snapshot

Take a Supabase named backup of production DB: `pre-multi-tenant-<YYYYMMDD>`. Retention: 30 days minimum.

### 8.2 Migration steps (in order)

```
1. CREATE TABLE schools, school_domains, school_requests (Section 4).
2. INSERT INTO schools (id, slug, name, display_short, contest_enabled)
   VALUES ('<sage-uuid>', 'sage', 'Sage Hill School', 'Sage', true);
   -- sage-uuid hardcoded in migration for stability across re-runs.
3. INSERT INTO school_domains (school_id, domain)
   VALUES ('<sage-uuid>', 'sagehillschool.org');
4. ALTER TABLE <each-tenant-table> ADD COLUMN school_id uuid NULL;
   -- users, departments, courses, units, materials, user_courses,
   -- contest_settings, contest_winners
5. UPDATE <each-tenant-table> SET school_id = '<sage-uuid>'
   WHERE school_id IS NULL;
6. Special: rework contest_settings:
   - Capture existing singleton row (id=1) values.
   - Drop id column, set school_id as PK.
   - Verify one row exists, keyed by sage-uuid.
7. ALTER TABLE ... ALTER COLUMN school_id SET NOT NULL on all tenant tables.
8. Add composite unique constraints and FKs (Section 4 denormalization).
9. CREATE FUNCTIONs current_school_id(), is_superadmin().
10. CREATE POLICYs on every tenant table.
11. ALTER TABLE ... ENABLE ROW LEVEL SECURITY on every tenant table.
12. Install Supabase Auth Hook (Custom Access Token) to populate JWT claims.
13. Verification queries (Section 8.3).
```

### 8.3 Verification (before DB branch merges to prod)

- `SELECT COUNT(*) FROM <each-table> WHERE school_id IS NULL` → 0 for every table.
- Row counts per table before/after match exactly.
- Anon fetch of `/s/sage/leaderboard` returns same top-10 rankings as pre-migration production.
- Logged-in Sage user (after token refresh): dashboard loads, courses visible, submit form works end-to-end.
- Test insert: create fake `oakwood` school via SQL. Visit `/s/oakwood/` anon → sees empty state. Logged-in Sage student visiting `/s/oakwood/leaderboard` → treated as anon, sees empty leaderboard (no Sage bleed-through). Superadmin → sees everything.
- `successatsage.com/*` on preview deployment → 301s to `successaths.com/s/sage/*`.

### 8.4 Rollback plan

Each migration step has a reverse script in `supabase/migrations/rollback/`:
- Drop RLS policies.
- Disable RLS.
- Drop helper functions.
- Drop composite FKs and unique constraints.
- Drop `school_id` column from each tenant table.
- Restore `contest_settings` singleton shape.
- Drop `school_domains`, `school_requests`, `schools` tables.

Post-merge rollback: restore from named backup `pre-multi-tenant-<YYYYMMDD>`.

---

## 9. Domain Cutover

### 9.1 Pre-cutover

1. Purchase `successaths.com`. (User flag: verify the name reads as intended — could be ambiguous between "Success at HS" and other parses.)
2. Add `successaths.com` to Vercel project as a domain on the `build/multi-tenant-migration` branch deployment. Branch preview URL testing happens there.
3. `successatsage.com` stays on production Vercel deployment throughout.

### 9.2 Cutover sequence

1. Merge Supabase DB preview branch to production. Production DB now has school_id columns, RLS, new tables. Pre-migration app still works because all Sage rows have `school_id` set and RLS policies match.
2. Promote `build/multi-tenant-migration` Vercel deployment to production. Both domains now serve the multi-tenant app.
3. Add 301 redirect rules (in `next.config.ts` or `vercel.ts`):
   - `successatsage.com/*` → `successaths.com/s/sage/*` (permanent 301), preserving path and query.
   - Exception: `/auth/callback` paths during the transition period if needed.
4. Update Supabase Auth redirect URLs in Supabase dashboard to include `https://successaths.com/*`.
5. Update env vars:
   - `NEXT_PUBLIC_SITE_URL` → `https://successaths.com`
   - Any OG-image absolute URL bases.
6. Regenerate OG marketing assets (via admin `/og/*` routes) so they embed the new domain.

### 9.3 User impact

- **Posters/QR codes**: still work via 301 redirect.
- **Bookmarks**: redirect resolves to tenant URL.
- **Active sessions at cutover**: session cookie on `successatsage.com` doesn't carry to `successaths.com`. Users are bounced to `/login` once. Announce via Instagram story.
- **OG share links previously posted**: redirect via 301.

### 9.4 Rollback at cutover

- Vercel: "Promote previous deployment" — one-click revert to pre-migration production.
- `successaths.com`: detach from Vercel (optional — can also leave domain parked).
- DB: if rolled back before significant new-tenant data lands, restore from named backup. If multi-tenant has been live for hours/days with real activity, prefer fixing-forward over rolling back.

---

## 10. Reversibility Plan

Four independent layers, each revertible without touching the others.

### 10.1 Git

- All work on branch `build/multi-tenant-migration` in a worktree at `../successatsage-multi-tenant/`.
- `main` frozen at `29e1606`, tagged `v-pre-multi-tenant`.
- Revert: don't merge. Post-merge: `git revert <merge-commit>` (preserves history).

### 10.2 Database

- All work on Supabase DB preview branch. Production DB untouched pre-merge.
- Named backup `pre-multi-tenant-<YYYYMMDD>` of production DB taken before merge.
- Pre-merge revert: delete DB branch.
- Post-merge revert: execute rollback migrations (Section 8.4) or restore from named backup.

### 10.3 Deployment

- Every commit on branch generates an isolated Vercel preview deployment.
- Production stays on current deployment until explicit "Promote to Production" click.
- Revert: "Promote previous deployment" in Vercel dashboard.

### 10.4 Domain

- `successaths.com` points at branch deployment during development; production only at cutover.
- `successatsage.com` unchanged until cutover-time 301 rule added.
- Revert: un-promote deployment; remove 301 rule from config.

### 10.5 Named checkpoints

Created before any code changes:

1. Git tag: `v-pre-multi-tenant` at `29e1606`.
2. Supabase backup: `pre-multi-tenant-<YYYYMMDD>`.
3. Current production Vercel deployment ID is captured in the implementation kickoff checklist (not in this design doc), so it can be re-promoted in one click if rollback is needed post-cutover.
4. Branch `main` frozen; no other commits land there while multi-tenant work is in progress.

---

## 11. Open Questions / Deferred Scope

Not blocking this spec; revisit post-launch or when the triggering customer materializes.

- **Per-school branding** (logos, accent colors, grade range). All schools share Sage's violet today. Defer until a second school with different identity demand signs up.
- **Subdomain vs path-prefix** upgrade. Middleware already capable of rewriting `sage.successaths.com/foo` → `/s/sage/foo` if a school later wants vanity subdomains — additive, no code churn.
- **Cross-school content sharing.** A student uploads AP Chem notes; other schools' students might benefit. Deferred; requires moderation model.
- **Course catalog templates / canonical course list** for faster new-school bootstrap. Deferred in favor of concierge imports.
- **Automated email for request/approval/rejection** — v1 may be superadmin-dashboard-only with manual email; Resend integration is incremental.
- **Per-school feature flags** beyond `contest_enabled`. Deferred; add when second flag is demanded.
- **Audit log** for superadmin actions (school approvals, impersonation sessions). Deferred; stakes low at current scale.

---

## 12. Success Criteria

The migration is considered complete when:

1. Sage users hit `successatsage.com`, get redirected, and continue using the platform with no observable behavioral regression.
2. A second school (real or test) can be created via the superadmin flow, its admin signs up, and both tenants coexist with zero cross-tenant data visibility (verified manually via `/admin/impersonate`).
3. RLS policies are active on every tenant-scoped table; `supabaseAdmin` (service role) usage is confined to admin operations that explicitly need RLS bypass.
4. All existing OG marketing routes, leaderboard, dashboard, submit, admin contest, admin submissions work under `/s/sage/...`.
5. Rollback runbook (Section 10) has been dry-run on the DB preview branch before merge.
