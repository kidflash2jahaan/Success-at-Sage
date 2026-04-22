-- 0013_phase4b_superadmin_queue.sql
-- Phase 4b: superadmin review queue backing tables + hook extension +
-- helper RPCs. Already applied to prod via MCP apply_migration.

BEGIN;

-- Bootstrap table: emails that will auto-promote to admin of the given
-- school on their next login. Populated by approveSchoolRequest;
-- consumed by promote_pending_school_admin in the onboarding flow.
CREATE TABLE IF NOT EXISTS private.pending_school_admins (
  email text NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (email, school_id)
);
GRANT SELECT, INSERT, DELETE ON private.pending_school_admins TO supabase_auth_admin;

-- Extend the Custom Access Token hook to include pending_school_admin_for
-- claim so the UI can offer the user a nudge to accept their new admin
-- role.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path = public, private
AS $$
DECLARE
  claims jsonb;
  user_row record;
  is_sa boolean := false;
  pending_sid uuid;
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

    SELECT school_id INTO pending_sid
    FROM private.pending_school_admins
    WHERE email = lower(trim(user_row.email))
    LIMIT 1;
    IF pending_sid IS NOT NULL THEN
      claims := jsonb_set(claims, '{pending_school_admin_for}', to_jsonb(pending_sid::text));
    END IF;
  END IF;

  claims := jsonb_set(claims, '{is_superadmin}', to_jsonb(is_sa));
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- is_superadmin_email: used by the superadmin guard in the server
-- (service-role calls only).
CREATE OR REPLACE FUNCTION public.is_superadmin_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1 FROM private.superadmin_emails WHERE email = lower(trim(p_email))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_superadmin_email(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.is_superadmin_email(text) TO service_role;

-- mark_pending_school_admin: called by approveSchoolRequest server action
-- to flag the requester as a future admin of the newly-created school.
CREATE OR REPLACE FUNCTION public.mark_pending_school_admin(p_email text, p_school_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
AS $$
  INSERT INTO private.pending_school_admins (email, school_id)
  VALUES (lower(trim(p_email)), p_school_id)
  ON CONFLICT DO NOTHING;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_pending_school_admin(text, uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.mark_pending_school_admin(text, uuid) TO service_role;

-- promote_pending_school_admin: atomic promotion on first login after
-- school approval. Returns the promoted school_id (NULL if not pending).
CREATE OR REPLACE FUNCTION public.promote_pending_school_admin(p_user_id uuid, p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  sid uuid;
BEGIN
  SELECT school_id INTO sid
  FROM private.pending_school_admins
  WHERE email = lower(trim(p_email))
  LIMIT 1;

  IF sid IS NULL THEN RETURN NULL; END IF;

  UPDATE public.users SET role = 'admin', school_id = sid WHERE id = p_user_id;
  DELETE FROM private.pending_school_admins WHERE email = lower(trim(p_email));

  RETURN sid;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.promote_pending_school_admin(uuid, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.promote_pending_school_admin(uuid, text) TO service_role;

COMMIT;
