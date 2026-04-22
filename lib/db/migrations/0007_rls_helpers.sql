-- 0007_rls_helpers.sql
-- Phase 2 / Task 1: helper functions for RLS policies.
--
-- current_school_id() prefers the JWT claim (authed users); falls back to
-- a Postgres session setting (for anon visitors once Phase 3 middleware
-- sets `app.school_id` per request). Phase 2 only populates the JWT side.
--
-- is_superadmin() reads the claim set by the auth hook. Bootstrap check
-- via superadmin_emails is done inside the hook itself; is_superadmin()
-- is the runtime read.
--
-- superadmin_emails lives in a PRIVATE schema so it's not reachable via
-- the Data API. Seeded from ADMIN_EMAILS env var via execute_sql call in Task 2.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TABLE private.superadmin_emails (
  email text PRIMARY KEY
);

CREATE OR REPLACE FUNCTION public.current_school_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'school_id', '')::uuid,
    NULLIF(current_setting('app.school_id', true), '')::uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_superadmin')::boolean, false);
$$;

-- Grant EXECUTE to anon/authenticated so RLS policies (evaluated under
-- the caller's role) can invoke these helpers.
GRANT EXECUTE ON FUNCTION public.current_school_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon, authenticated;

COMMIT;
