# Phase 3 — Route Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every tenant-scoped route lives under `app/s/[schoolSlug]/`. The root `/` is a generic marketing landing (not Sage-branded). Logged-in users bounce to `/s/<their-slug>/dashboard`. Anonymous visitors can read `/s/<slug>/leaderboard`. Old paths (`/dashboard`, `/leaderboard`, etc.) 301 to the Sage-scoped equivalents so all outstanding links/QR codes keep working. The `SAGE_SCHOOL_ID` constant is replaced by slug resolution from the URL.

**Architecture:** Next.js dynamic segment `[schoolSlug]` resolves at the layout level. Middleware inspects the slug, looks it up in `schools`, and sets a Postgres session setting `app.school_id` on the anon Supabase client so RLS filters public pages correctly. Authenticated queries read `school_id` from JWT claim (already populated by Phase 2's auth hook). Hard-coded `.eq('school_id', SAGE_SCHOOL_ID)` calls are replaced with `.eq('school_id', resolvedSchoolId)` sourced from the layout's resolved tenant.

**Tech Stack:** Next.js 16 App Router, Supabase SSR client, TypeScript.

**Spec:** `docs/superpowers/specs/2026-04-21-multi-tenant-design.md` §3, §6.
**Base:** `phase-2-complete`.
**Sage slug / UUID:** `sage` / `a0000000-0000-0000-0000-000000000001`.

---

## Preconditions (from Phase 2)

- Custom Access Token hook ENABLED in Supabase dashboard (JWT claims flowing)
- Phase-1 DEFAULT clauses DROPPED (Phase 2 Task 6b) — so any insert path still using service-role admin + explicit `school_id` keeps working; RLS-protected paths need the JWT claim to be live.

If either precondition is not met, pause Phase 3 and complete them first.

---

## Scope decisions

- **Keep service-role admin client** for server-side reads on public pages (landing, leaderboard). RLS already permits schools/school_domains public reads, but using admin client preserves current performance profile.
- **Switch authenticated-user queries** (dashboard, submit, profile) to the anon/authenticated Supabase client so RLS filters automatically.
- **Middleware pattern**: read slug from URL, resolve to `school_id`, inject into `cookies()` as `school_id_<slug>` cache, and pass to the server Supabase client.
- **301 back-compat redirects** live in `next.config.ts` (or `vercel.ts`). They permanently redirect the top-level tenant paths.

---

## File manifest

**Create (new routes under `app/s/[schoolSlug]/`):**
- `app/s/[schoolSlug]/layout.tsx` — tenant resolver + Postgres session context
- `app/s/[schoolSlug]/page.tsx` — tenant landing (copy of current `/`)
- `app/s/[schoolSlug]/leaderboard/page.tsx`
- `app/s/[schoolSlug]/dashboard/page.tsx`
- `app/s/[schoolSlug]/submit/page.tsx`
- `app/s/[schoolSlug]/browse/page.tsx`
- `app/s/[schoolSlug]/profile/page.tsx`
- `app/s/[schoolSlug]/profile/edit/[id]/page.tsx`
- `app/s/[schoolSlug]/courses/[slug]/page.tsx`
- `app/s/[schoolSlug]/courses/[slug]/units/[id]/page.tsx`
- `app/s/[schoolSlug]/search/page.tsx`
- `app/s/[schoolSlug]/trending/page.tsx`
- `app/s/[schoolSlug]/onboarding/page.tsx`
- `app/s/[schoolSlug]/admin/contest/page.tsx` + siblings
- `app/s/[schoolSlug]/og/` — entire `/og/` subtree moves here
- `lib/tenant.ts` — `resolveTenantBySlug(slug)` helper
- `middleware.ts` — replace/extend root middleware with tenant resolution

**Modify:**
- `app/page.tsx` — replace Sage-specific content with generic marketing landing + "Sign in" button
- `app/(public)/leaderboard/page.tsx`, `app/(app)/*`, `app/(admin)/*`, `app/og/*` — these become 301 redirects or get deleted after the new routes are verified
- `lib/constants.ts` — delete `SAGE_SCHOOL_ID`; replace with `lib/tenant.ts`
- All 14 query sites that reference `SAGE_SCHOOL_ID` — use the resolved tenant from the layout's context
- `next.config.ts` — add 301 redirects

**Delete (at end, after new routes verified):**
- `app/(app)/*`, `app/(public)/*`, `app/(admin)/*` — replaced by `/s/[schoolSlug]/*`
- `app/onboarding/page.tsx` — moved to `/s/[schoolSlug]/onboarding/`
- `app/og/*` — moved to `/s/[schoolSlug]/og/`

---

## Task 0: Pre-flight

Same pattern as Phase 1/2:
```bash
cd /Users/jahaan/Desktop/successatsage
git worktree add -b build/phase-3-routes ../successatsage-phase-3 phase-2-complete
cd ../successatsage-phase-3
cp /Users/jahaan/Desktop/successatsage/.env.local .env.local
npm install
npx tsc --noEmit
```

Confirm typecheck exit 0.

---

## Task 1: Tenant resolver helper

**Files:**
- Create: `lib/tenant.ts`

- [ ] **Step 1: Write**

```ts
// lib/tenant.ts
import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export type Tenant = {
  id: string          // uuid
  slug: string        // "sage"
  name: string        // "Sage Hill School"
  displayShort: string // "Sage"
  contestEnabled: boolean
}

/** Resolve slug → Tenant. 404s if the school doesn't exist. */
export async function resolveTenantBySlug(slug: string): Promise<Tenant> {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('id, slug, name, display_short, contest_enabled')
    .eq('slug', slug)
    .single()
  if (error || !data) notFound()
  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    displayShort: data.display_short as string,
    contestEnabled: data.contest_enabled as boolean,
  }
}

/** Resolve email domain → Tenant. Returns null if no school matches. */
export async function resolveTenantByEmail(email: string): Promise<Tenant | null> {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  const { data: dom } = await supabaseAdmin
    .from('school_domains')
    .select('school_id')
    .eq('domain', domain)
    .single()
  if (!dom) return null
  const { data: s } = await supabaseAdmin
    .from('schools')
    .select('id, slug, name, display_short, contest_enabled')
    .eq('id', dom.school_id)
    .single()
  if (!s) return null
  return {
    id: s.id as string, slug: s.slug as string, name: s.name as string,
    displayShort: s.display_short as string, contestEnabled: s.contest_enabled as boolean,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tenant.ts
git commit -m "feat(tenant): slug resolver + email-domain resolver"
```

---

## Task 2: Tenant layout

**Files:**
- Create: `app/s/[schoolSlug]/layout.tsx`

- [ ] **Step 1: Write**

```tsx
// app/s/[schoolSlug]/layout.tsx
import { resolveTenantBySlug } from '@/lib/tenant'
import { TenantProvider } from '@/lib/tenant-context'

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ schoolSlug: string }>
}) {
  const { schoolSlug } = await params
  const tenant = await resolveTenantBySlug(schoolSlug)
  return <TenantProvider tenant={tenant}>{children}</TenantProvider>
}
```

- [ ] **Step 2: Create `lib/tenant-context.ts`** with a React context that child server components can read (via `cache()` or a server-only accessor):

```ts
// lib/tenant-context.ts
import 'server-only'
import { cache } from 'react'
import type { Tenant } from '@/lib/tenant'

// We can't use React context across server/client boundaries; use a
// server-only cache keyed by request instead. Each request cycles the
// cached tenant via the layout's TenantProvider pseudo-component (which
// actually just stashes into the cache).

let _currentTenant: Tenant | null = null
export const TenantProvider = ({ tenant, children }: { tenant: Tenant; children: React.ReactNode }) => {
  _currentTenant = tenant
  return children as any
}
export const getCurrentTenant = cache((): Tenant => {
  if (!_currentTenant) throw new Error('getCurrentTenant called outside /s/[schoolSlug] layout')
  return _currentTenant
})
```

**Note:** This module-level singleton is request-scoped by Next.js's per-request isolation in Node.js runtime. If this becomes flaky, fall back to reading slug from the URL via `headers().get('x-next-url')` in each page. Test carefully.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add app/s/[schoolSlug]/layout.tsx lib/tenant-context.ts
git commit -m "feat(routes): tenant layout + per-request tenant context"
```

---

## Task 3: Copy each Sage route to `app/s/[schoolSlug]/`

For each of the 13 existing routes (listed in the file manifest), copy the page into `app/s/[schoolSlug]/<same-path>/page.tsx`, then replace every `.eq('school_id', SAGE_SCHOOL_ID)` with `.eq('school_id', tenant.id)` where `tenant = getCurrentTenant()`.

**Files:** 13 copies; modifications inline.

Per-route template (example for dashboard):

```tsx
// app/s/[schoolSlug]/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/auth'
import { getUserCourses } from '@/lib/db/queries/courses'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentTenant } from '@/lib/tenant-context'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await requireUser()
  const tenant = getCurrentTenant()
  const [userCourses, { data: contestSettings }] = await Promise.all([
    getUserCourses(user.id),
    supabaseAdmin.from('contest_settings').select('prize_description, next_reset_date').eq('school_id', tenant.id).single(),
  ])
  // ... rest unchanged
}
```

- [ ] **Step 1–13: One route at a time**, each with its own commit. Typecheck after each.

- [ ] **Step 14: Copy `app/og/` → `app/s/[schoolSlug]/og/`**; update `app/og/_lib/data.ts` to accept a `schoolId` arg rather than hardcoding `SAGE_SCHOOL_ID`.

---

## Task 4: Generic root landing

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace with generic landing**

```tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { resolveTenantByEmail } from '@/lib/tenant'
import { redirect } from 'next/navigation'

export default async function RootLanding() {
  const user = await getCurrentUser().catch(() => null)
  if (user?.email) {
    const tenant = await resolveTenantByEmail(user.email)
    if (tenant) redirect(`/s/${tenant.slug}/dashboard`)
  }

  return (
    <div>
      <h1>Success at Schools</h1>
      <p>A student-built study platform used by Sage Hill School and beyond.</p>
      <Link href="/signup">Sign up</Link>
      <Link href="/login">Log in</Link>
      <Link href="/request-school">Request your school</Link>
    </div>
  )
}
```

(Replace with existing visual design, scaled down to be generic. Keep the hero's gradient palette but drop "Sage" branding.)

- [ ] **Step 2: Commit**

---

## Task 5: 301 redirects for old paths

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add redirects**

```ts
import type { NextConfig } from 'next'
const config: NextConfig = {
  async redirects() {
    return [
      { source: '/dashboard',                    destination: '/s/sage/dashboard', permanent: true },
      { source: '/leaderboard',                  destination: '/s/sage/leaderboard', permanent: true },
      { source: '/browse',                       destination: '/s/sage/browse', permanent: true },
      { source: '/submit',                       destination: '/s/sage/submit', permanent: true },
      { source: '/profile',                      destination: '/s/sage/profile', permanent: true },
      { source: '/profile/edit/:id',             destination: '/s/sage/profile/edit/:id', permanent: true },
      { source: '/courses/:slug',                destination: '/s/sage/courses/:slug', permanent: true },
      { source: '/courses/:slug/units/:id',      destination: '/s/sage/courses/:slug/units/:id', permanent: true },
      { source: '/trending',                     destination: '/s/sage/trending', permanent: true },
      { source: '/search',                       destination: '/s/sage/search', permanent: true },
      { source: '/onboarding',                   destination: '/s/sage/onboarding', permanent: true },
      { source: '/admin',                        destination: '/s/sage/admin', permanent: true },
      { source: '/admin/:path*',                 destination: '/s/sage/admin/:path*', permanent: true },
      { source: '/og/:path*',                    destination: '/s/sage/og/:path*', permanent: true },
    ]
  },
}
export default config
```

---

## Task 6: Delete old route files

After the new `/s/[schoolSlug]/*` tree is verified on a preview deploy, delete the old files in `app/(app)/`, `app/(public)/`, `app/(admin)/`, `app/onboarding/`, `app/og/`.

**This step is destructive — do it LAST, after local + preview deploy verification.**

```bash
rm -rf app/\(app\) app/\(public\) app/\(admin\) app/onboarding app/og
```

Typecheck + build. Commit.

---

## Task 7: Remove SAGE_SCHOOL_ID

**Files:**
- Delete: `lib/constants.ts`
- Modify: every file importing `SAGE_SCHOOL_ID`

After the copy-paste in Task 3, every usage of `SAGE_SCHOOL_ID` should be gone. Grep to confirm:

```bash
grep -rn "SAGE_SCHOOL_ID" lib/ app/
```

Expected: zero matches. Delete `lib/constants.ts`. Typecheck.

---

## Task 8: Verification

- [ ] Typecheck + build
- [ ] Smoke test: `/` renders generic landing, `/dashboard` 301 → `/s/sage/dashboard`
- [ ] Logged-in user lands on `/s/sage/dashboard`, all data renders
- [ ] `/s/sage/leaderboard` renders anonymously
- [ ] `/s/oakwood/*` → 404 (tenant doesn't exist — tests slug-resolution error path)
- [ ] OG routes render correctly at `/s/sage/og/*`

---

## Rollback

Git revert the merge commit. Routes fall back to old paths via git history.
