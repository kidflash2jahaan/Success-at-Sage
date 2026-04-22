/**
 * Sage tenant UUID — used only by initial-seed tooling:
 *   - lib/db/seed.ts         (seeds the first tenant at project setup)
 *   - scripts/verify-phase-1.ts (historical migration check)
 *
 * No runtime app code references this anymore. Phase 4b moved all
 * server actions to derive school_id from the user's DB row via
 * `getUserSchoolId`, and tenant pages derive it from the URL slug.
 * Safe to delete once the two tooling files look Sage up by slug.
 */
export const SAGE_SCHOOL_ID = 'a0000000-0000-0000-0000-000000000001'
