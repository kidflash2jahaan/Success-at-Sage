-- 0006_material_views_school_id.sql
-- Phase 1 follow-up: extend tenant scoping to material_views.
--
-- material_views was missed by the original Phase 1 plan. This migration
-- brings it in line with the other 8 tenant-scoped tables so the
-- "every tenant row carries school_id" invariant is actually true.
--
-- Pattern mirrors 0003 + 0004 for a single table.
--
-- Single transaction; partial apply impossible.

BEGIN;

-- 0. materials needs UNIQUE (school_id, id) to act as a parent of the
--    composite FK from material_views added below. (0004 only added
--    this to users/departments/courses/units — nothing referenced
--    materials as a parent in Phase 1 until this migration.)
ALTER TABLE materials ADD CONSTRAINT materials_school_id_id_key UNIQUE (school_id, id);

-- 1. Add school_id with DEFAULT Sage (zero-downtime: old code path via
--    the increment_view_count RPC doesn't specify school_id; the DEFAULT
--    fills it in).
ALTER TABLE material_views
  ADD COLUMN school_id uuid REFERENCES schools(id)
  DEFAULT 'a0000000-0000-0000-0000-000000000001';

-- 2. Backfill (redundant after DEFAULT but explicit for clarity)
UPDATE material_views SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;

-- 3. Assert invariant
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM material_views WHERE school_id IS NULL;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'material_views has % rows with NULL school_id', cnt;
  END IF;
END $$;

-- 4. Lock NOT NULL
ALTER TABLE material_views ALTER COLUMN school_id SET NOT NULL;

-- 5. Replace single-column FKs with composite FKs for cross-tenant
--    integrity, matching the pattern in 0004.
ALTER TABLE material_views DROP CONSTRAINT material_views_material_id_fkey;
ALTER TABLE material_views
  ADD CONSTRAINT material_views_material_fk
  FOREIGN KEY (school_id, material_id)
  REFERENCES materials (school_id, id)
  ON DELETE CASCADE;

ALTER TABLE material_views DROP CONSTRAINT material_views_user_id_fkey;
ALTER TABLE material_views
  ADD CONSTRAINT material_views_user_fk
  FOREIGN KEY (school_id, user_id)
  REFERENCES users (school_id, id)
  ON DELETE CASCADE;

COMMIT;
