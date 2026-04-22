-- 0008_rls_policies.sql
-- Phase 2 / Task 4: enable RLS and attach tenant-isolation policies to
-- every tenant-scoped table. Applied AFTER 0007 (helpers) and 0009
-- (hook function) so current_school_id() and is_superadmin() exist.
--
-- Policy pattern from spec §5:
--   READ:  school_id = current_school_id() OR is_superadmin()
--   WRITE: same, with WITH CHECK (same).
--
-- Materials has layered policies (tenant + student-sees-approved).
-- schools + school_domains + school_requests have special policies
-- since they're not strictly per-tenant (schools lookup needs to work
-- cross-tenant for slug resolution, request-to-create is public insert,
-- etc.).

BEGIN;

-- Drop the Phase-0 policies (from 0001_rls_and_storage.sql) that predate tenancy
DROP POLICY IF EXISTS "Departments are publicly readable" ON public.departments;
DROP POLICY IF EXISTS "Courses are publicly readable" ON public.courses;
DROP POLICY IF EXISTS "Units are publicly readable" ON public.units;
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Authenticated can read approved materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Users can read own enrollments" ON public.user_courses;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.user_courses;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.user_courses;

-- Enable RLS (idempotent)
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_winners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_domains   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_requests  ENABLE ROW LEVEL SECURITY;

-- Tenant-isolation policies (one pair per table)
CREATE POLICY tenant_read  ON public.users            FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.users            FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.departments      FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.departments      FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.courses          FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.courses          FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.units            FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.units            FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

-- Materials: tenant isolation + students-see-approved-only + uploaders-see-own
CREATE POLICY tenant_read_materials ON public.materials FOR SELECT
  USING (
    (school_id = public.current_school_id() OR public.is_superadmin())
    AND (status = 'approved' OR uploaded_by = auth.uid() OR public.is_superadmin())
  );
CREATE POLICY tenant_insert_materials ON public.materials FOR INSERT
  WITH CHECK (
    (school_id = public.current_school_id() OR public.is_superadmin())
    AND (uploaded_by = auth.uid() OR public.is_superadmin())
  );
CREATE POLICY tenant_update_materials ON public.materials FOR UPDATE
  USING (school_id = public.current_school_id() OR public.is_superadmin())
  WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete_materials ON public.materials FOR DELETE
  USING (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.user_courses     FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.user_courses     FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.contest_settings FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.contest_settings FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.contest_winners  FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.contest_winners  FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

CREATE POLICY tenant_read  ON public.material_views   FOR SELECT USING (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_write ON public.material_views   FOR ALL    USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());

-- schools, school_domains: public read (needed for slug→id resolution
-- and signup domain lookup — both work cross-tenant)
CREATE POLICY schools_public_read         ON public.schools         FOR SELECT USING (true);
CREATE POLICY school_domains_public_read  ON public.school_domains  FOR SELECT USING (true);

-- school_requests: anyone can submit a request (public form); only
-- superadmin can read/manage
CREATE POLICY school_requests_public_insert   ON public.school_requests FOR INSERT WITH CHECK (true);
CREATE POLICY school_requests_superadmin_read ON public.school_requests FOR SELECT USING (public.is_superadmin());
CREATE POLICY school_requests_superadmin_mod  ON public.school_requests FOR UPDATE USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
CREATE POLICY school_requests_superadmin_del  ON public.school_requests FOR DELETE USING (public.is_superadmin());

COMMIT;
