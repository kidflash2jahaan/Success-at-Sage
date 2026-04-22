-- 0009_custom_access_token_hook.sql
-- Phase 2 / Task 3: Supabase Auth Hook — Custom Access Token.
--
-- Runs inside supabase_auth_admin's transaction on every token issuance
-- (signup, login, refresh). Injects two custom claims into the JWT:
--   - school_id:     the user's school's uuid (from public.users.school_id)
--   - is_superadmin: true iff user's email is in private.superadmin_emails
--
-- The hook is DEFINED by this migration but not yet ENABLED. Enabling
-- requires a dashboard click: Authentication → Hooks → Custom Access
-- Token → select public.custom_access_token_hook.

BEGIN;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  claims jsonb;
  user_row record;
  is_sa boolean := false;
BEGIN
  claims := COALESCE(event->'claims', '{}'::jsonb);

  SELECT u.school_id, u.email
    INTO user_row
  FROM public.users u
  WHERE u.id = (event->>'user_id')::uuid;

  IF user_row.school_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{school_id}', to_jsonb(user_row.school_id::text));
  END IF;

  IF user_row.email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM private.superadmin_emails WHERE email = lower(trim(user_row.email))
    ) INTO is_sa;
  END IF;
  claims := jsonb_set(claims, '{is_superadmin}', to_jsonb(is_sa));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon, authenticated, public;

GRANT SELECT ON public.users TO supabase_auth_admin;
GRANT USAGE ON SCHEMA private TO supabase_auth_admin;
GRANT SELECT ON private.superadmin_emails TO supabase_auth_admin;

COMMIT;
