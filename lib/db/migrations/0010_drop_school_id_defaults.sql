-- 0010_drop_school_id_defaults.sql
-- Phase 2 Task 6b: remove the Phase-1 DEFAULT Sage clauses. Any insert
-- path that forgets school_id now fails LOUDLY with NOT NULL violation,
-- which is what we want — prevents silent tenant leaks in Phase 3+.
--
-- Prerequisites verified before applying:
-- - All app-code INSERTs set school_id explicitly (signup.ts, auth.ts,
--   materials.ts, admin.ts, courses.ts, seed.ts).
-- - increment_view_count RPC updated in 0012 to look up + set school_id.
--
-- Must apply AFTER 0012 below. Numbered 0010 to match plan ordering.

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
