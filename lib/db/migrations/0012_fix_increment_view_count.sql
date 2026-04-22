-- 0012_fix_increment_view_count.sql
-- Phase 2 follow-up: increment_view_count must look up school_id from
-- materials and set it on the inserted material_views row. Without this,
-- the RPC violates NOT NULL once 0010 drops the DEFAULT.
--
-- Also pin search_path per the same SECURITY lint that 0011 fixed for
-- Phase-2 functions.

BEGIN;

CREATE OR REPLACE FUNCTION public.increment_view_count(p_material_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted boolean;
  mat_school_id uuid;
BEGIN
  SELECT school_id INTO mat_school_id FROM public.materials WHERE id = p_material_id;
  IF mat_school_id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.material_views (material_id, user_id, school_id)
  VALUES (p_material_id, p_user_id, mat_school_id)
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted THEN
    UPDATE public.materials SET view_count = view_count + 1 WHERE id = p_material_id;
  END IF;
  RETURN inserted;
END;
$$;

COMMIT;
