-- 0011_function_search_path.sql
-- Phase 2 follow-up: pin search_path on Phase-2 functions to prevent
-- search_path-injection (Supabase security lint 0011). Applied as a
-- follow-up after 0007 + 0009 because the lint runs post-apply.
--
-- Scope: only the 3 Phase-2 functions. Pre-existing functions
-- (get_leaderboard, get_leaderboard_period, increment_view_count) are
-- Phase-0 artifacts out of scope here.

BEGIN;

ALTER FUNCTION public.current_school_id()             SET search_path = public, auth;
ALTER FUNCTION public.is_superadmin()                 SET search_path = public, auth;
ALTER FUNCTION public.custom_access_token_hook(jsonb) SET search_path = public, private;

COMMIT;
