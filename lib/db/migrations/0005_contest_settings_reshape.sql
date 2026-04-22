-- 0005_contest_settings_reshape.sql
-- Phase 1 / Task 5: contest_settings from id=1 singleton to school_id PK.
--
-- State going in: integer id PK (default 1), single existing row,
-- school_id already NOT NULL + FK'd from migration 0003.
-- State going out: school_id PK, id column gone.
--
-- This migration must apply AFTER the app code update (Task 6) has
-- deployed — the drop of the id column breaks any query still using
-- .eq('id', 1). Deploy order is enforced in Task 8.

BEGIN;

ALTER TABLE contest_settings DROP CONSTRAINT contest_settings_pkey;
ALTER TABLE contest_settings DROP COLUMN id;
ALTER TABLE contest_settings ADD PRIMARY KEY (school_id);

COMMIT;
