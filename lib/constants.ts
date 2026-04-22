/**
 * Hardcoded tenant constants for Phase 1 of the multi-tenant migration.
 *
 * During Phase 1 every query still hardcodes Sage because routing isn't
 * yet tenant-aware. Phase 3 (route restructure) replaces this constant
 * with `school_id` resolved from the URL slug / JWT claim, and the
 * constant can be deleted at that point.
 *
 * ============================================================================
 * PHASE 2 REMOVAL CHECKLIST (do NOT skip — silent-tenant-leak risk):
 * ============================================================================
 * As part of Phase 2 (RLS + Supabase Auth Hook), drop the DEFAULT clauses
 * added in Phase 1 migration 0003 (and 0006 for material_views). They
 * exist only to keep old app code working during the Phase 1 rollout; once
 * the auth hook supplies `school_id` from JWT claims, any insert path that
 * forgets to set it should FAIL LOUDLY rather than silently land in Sage.
 *
 * Tables to `ALTER COLUMN school_id DROP DEFAULT` on:
 *   users, departments, courses, units, materials, user_courses,
 *   contest_settings, contest_winners, material_views
 *
 * Also verify: every INSERT path in app/ explicitly sets school_id.
 * (Previous Phase 1 audit missed `app/actions/auth.ts` completeOnboarding;
 * re-grep INSERT/upsert call sites during Phase 2.)
 * ============================================================================
 */
export const SAGE_SCHOOL_ID = 'a0000000-0000-0000-0000-000000000001'
