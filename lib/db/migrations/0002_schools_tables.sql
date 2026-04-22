-- 0002_schools_tables.sql
-- Phase 1 / Task 2: create the three tenant-management tables and seed
-- Sage as the flagship tenant. Single transaction so partial apply is
-- impossible — either all tables exist with Sage seeded, or nothing.

BEGIN;

CREATE TYPE school_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  display_short text NOT NULL,
  contest_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE school_domains (
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  domain text NOT NULL,
  PRIMARY KEY (school_id, domain),
  UNIQUE (domain)
);

CREATE TABLE school_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_slug text NOT NULL,
  proposed_name text NOT NULL,
  proposed_display_short text NOT NULL,
  proposed_domains text[] NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_role text,
  notes text,
  status school_request_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX school_requests_status_idx ON school_requests(status);
CREATE INDEX school_requests_requester_email_idx ON school_requests(requester_email);

-- Seed Sage. UUID hardcoded so the value is stable across re-runs of
-- the migration on preview branches, and so application code can
-- reference SAGE_SCHOOL_ID as a constant until Phase 3 wires up slug
-- resolution from the URL.
INSERT INTO schools (id, slug, name, display_short, contest_enabled)
VALUES ('a0000000-0000-0000-0000-000000000001', 'sage', 'Sage Hill School', 'Sage', true);

INSERT INTO school_domains (school_id, domain)
VALUES ('a0000000-0000-0000-0000-000000000001', 'sagehillschool.org');

COMMIT;
