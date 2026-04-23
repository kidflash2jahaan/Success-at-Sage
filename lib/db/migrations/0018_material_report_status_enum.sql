-- Convert material_reports.status from text + CHECK constraint to a proper
-- Postgres enum, matching how the other status columns in this schema
-- (role, material_type, content_type, status, school_request_status) are
-- modeled. Drizzle sees the real enum type now.
--
-- The partial index and the CHECK constraint from 0017 both reference
-- status as text, so both must be dropped before the column type changes
-- and the index must then be recreated against the new enum type.

DROP INDEX IF EXISTS material_reports_pending_idx;
ALTER TABLE material_reports DROP CONSTRAINT IF EXISTS material_reports_status_check;

CREATE TYPE material_report_status AS ENUM ('pending', 'resolved', 'dismissed');

ALTER TABLE material_reports
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE material_report_status USING status::material_report_status,
  ALTER COLUMN status SET DEFAULT 'pending';

CREATE INDEX material_reports_pending_idx ON material_reports(school_id, status) WHERE status = 'pending';
