-- 0003_school_id_columns.sql
-- Phase 1 / Task 3: add school_id to every tenant-scoped table.
--
-- Every ADD COLUMN includes DEFAULT Sage so that old app code (deployed
-- BEFORE this migration's matching code changes go live) can continue
-- to INSERT without explicitly setting school_id — existing rows and
-- in-flight inserts from old code all fill in Sage automatically. Zero
-- downtime window. Phase 2 drops these defaults when the Supabase Auth
-- Hook starts supplying school_id from JWT claims (otherwise a buggy
-- insert could silently land in the wrong tenant).
--
-- Single transaction: partial apply is impossible.

BEGIN;

-- 1. Add columns with DEFAULT Sage. Nullable during backfill so the DO
--    block below can assert invariants. Existing rows auto-fill via
--    DEFAULT (Postgres 11+ fills without table rewrite).
ALTER TABLE users            ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE departments      ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE courses          ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE units            ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE materials        ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE user_courses     ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE contest_settings ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE contest_winners  ADD COLUMN school_id uuid REFERENCES schools(id) DEFAULT 'a0000000-0000-0000-0000-000000000001';

-- 2. Redundant backfill (DEFAULT already filled), but explicit for clarity
UPDATE users            SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE departments      SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE courses          SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE units            SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE materials        SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE user_courses     SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE contest_settings SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;
UPDATE contest_winners  SET school_id = 'a0000000-0000-0000-0000-000000000001' WHERE school_id IS NULL;

-- 3. TDD-style assertion: fail the whole transaction if any row was missed.
DO $$
DECLARE tbl text; cnt int;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users','departments','courses','units','materials',
    'user_courses','contest_settings','contest_winners'
  ]) LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE school_id IS NULL', tbl) INTO cnt;
    IF cnt > 0 THEN
      RAISE EXCEPTION 'Table % has % rows with NULL school_id', tbl, cnt;
    END IF;
  END LOOP;
END $$;

-- 4. Lock NOT NULL
ALTER TABLE users            ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE departments      ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE courses          ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE units            ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE materials        ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE user_courses     ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE contest_settings ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE contest_winners  ALTER COLUMN school_id SET NOT NULL;

COMMIT;
