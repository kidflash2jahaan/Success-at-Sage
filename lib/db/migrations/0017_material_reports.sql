-- Material reports: any signed-in student at a tenant can flag an approved
-- material as violating the honor code, being copyrighted, etc. Reports
-- land in the admin queue at /s/[slug]/admin/reports.
--
-- Status transitions:
--   pending   → admin hasn't acted
--   resolved  → admin confirmed violation (typically alongside deleting the
--               material; delete cascades clear the report row anyway, but
--               keeping it lets admins see history for a still-present
--               material if they decided to keep it + note resolution)
--   dismissed → admin reviewed, not a violation

CREATE TABLE material_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX material_reports_pending_idx ON material_reports(school_id, status) WHERE status = 'pending';
CREATE INDEX material_reports_material_id_idx ON material_reports(material_id);

-- Defense in depth: service role (used by supabaseAdmin on the server) bypasses
-- RLS; this blocks any accidental direct client access from anon/authenticated.
ALTER TABLE material_reports ENABLE ROW LEVEL SECURITY;
