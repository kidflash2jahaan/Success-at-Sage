-- 0014_pin_legacy_search_path.sql
-- Phase 4b follow-up: pin search_path on the two remaining Phase-0
-- functions flagged by Supabase security advisors (lint 0011). Same
-- pattern as 0011 (Phase 2 functions) and 0012 (increment_view_count).
-- After this migration, every public function in the project has a
-- locked search_path.

BEGIN;

ALTER FUNCTION public.get_leaderboard()                               SET search_path = public;
ALTER FUNCTION public.get_leaderboard_period(p_start date, p_end date) SET search_path = public;

COMMIT;
