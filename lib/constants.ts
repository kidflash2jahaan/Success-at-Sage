/**
 * Hardcoded tenant constants for Phase 1 of the multi-tenant migration.
 *
 * During Phase 1 every query still hardcodes Sage because routing isn't
 * yet tenant-aware. Phase 3 (route restructure) replaces this constant
 * with `school_id` resolved from the URL slug / JWT claim, and the
 * constant can be deleted at that point.
 */
export const SAGE_SCHOOL_ID = 'a0000000-0000-0000-0000-000000000001'
