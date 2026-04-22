-- 0015_rls_performance.sql
-- Phase 4b follow-up. Three performance fixes from Supabase advisors
-- (performance lint report post-Phase-4b):
--
-- 1. multiple_permissive_policies — every tenant table had both
--    `tenant_read` (FOR SELECT) and `tenant_write` (FOR ALL). FOR ALL
--    includes SELECT, so Postgres evaluated both on every SELECT.
--    Fix: drop tenant_write, add separate tenant_insert / tenant_update /
--    tenant_delete so the SELECT path only evaluates tenant_read.
--
-- 2. auth_rls_initplan — materials policies called `auth.uid()` directly,
--    which re-runs for every row. Wrap with `(SELECT auth.uid())` so
--    Postgres lifts it to init-plan. Same fix applied to insert.
--
-- 3. unindexed_foreign_keys — Phase-2 composite FKs and Phase-4b FKs
--    had no covering indexes. Added composite and single-column indexes
--    on child tables + private.pending_school_admins.
--
-- Already applied to prod via MCP apply_migration.

BEGIN;

-- #1: split FOR ALL into per-action
DROP POLICY tenant_write ON public.users;
CREATE POLICY tenant_insert ON public.users FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.users FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.users FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.departments;
CREATE POLICY tenant_insert ON public.departments FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.departments FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.departments FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.courses;
CREATE POLICY tenant_insert ON public.courses FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.courses FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.courses FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.units;
CREATE POLICY tenant_insert ON public.units FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.units FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.units FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.user_courses;
CREATE POLICY tenant_insert ON public.user_courses FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.user_courses FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.user_courses FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.contest_settings;
CREATE POLICY tenant_insert ON public.contest_settings FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.contest_settings FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.contest_settings FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.contest_winners;
CREATE POLICY tenant_insert ON public.contest_winners FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.contest_winners FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.contest_winners FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

DROP POLICY tenant_write ON public.material_views;
CREATE POLICY tenant_insert ON public.material_views FOR INSERT WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_update ON public.material_views FOR UPDATE USING (school_id = public.current_school_id() OR public.is_superadmin()) WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete ON public.material_views FOR DELETE USING (school_id = public.current_school_id() OR public.is_superadmin());

-- #2: materials policies with (SELECT auth.uid()) for init-plan lift
DROP POLICY tenant_read_materials ON public.materials;
DROP POLICY tenant_insert_materials ON public.materials;
DROP POLICY tenant_update_materials ON public.materials;
DROP POLICY tenant_delete_materials ON public.materials;

CREATE POLICY tenant_read_materials ON public.materials FOR SELECT
  USING (
    (school_id = public.current_school_id() OR public.is_superadmin())
    AND (status = 'approved' OR uploaded_by = (SELECT auth.uid()) OR public.is_superadmin())
  );
CREATE POLICY tenant_insert_materials ON public.materials FOR INSERT
  WITH CHECK (
    (school_id = public.current_school_id() OR public.is_superadmin())
    AND (uploaded_by = (SELECT auth.uid()) OR public.is_superadmin())
  );
CREATE POLICY tenant_update_materials ON public.materials FOR UPDATE
  USING (school_id = public.current_school_id() OR public.is_superadmin())
  WITH CHECK (school_id = public.current_school_id() OR public.is_superadmin());
CREATE POLICY tenant_delete_materials ON public.materials FOR DELETE
  USING (school_id = public.current_school_id() OR public.is_superadmin());

-- #3: FK indexes
CREATE INDEX IF NOT EXISTS courses_school_id_department_id_idx  ON public.courses        (school_id, department_id);
CREATE INDEX IF NOT EXISTS units_school_id_course_id_idx        ON public.units          (school_id, course_id);
CREATE INDEX IF NOT EXISTS materials_school_id_unit_id_idx      ON public.materials      (school_id, unit_id);
CREATE INDEX IF NOT EXISTS materials_school_id_uploaded_by_idx  ON public.materials      (school_id, uploaded_by);
CREATE INDEX IF NOT EXISTS user_courses_school_id_user_id_idx   ON public.user_courses   (school_id, user_id);
CREATE INDEX IF NOT EXISTS user_courses_school_id_course_id_idx ON public.user_courses   (school_id, course_id);
CREATE INDEX IF NOT EXISTS contest_winners_school_id_user_id_idx ON public.contest_winners (school_id, user_id);
CREATE INDEX IF NOT EXISTS material_views_school_id_material_id_idx ON public.material_views (school_id, material_id);
CREATE INDEX IF NOT EXISTS material_views_school_id_user_id_idx     ON public.material_views (school_id, user_id);
CREATE INDEX IF NOT EXISTS contest_winners_school_id_idx ON public.contest_winners (school_id);
CREATE INDEX IF NOT EXISTS material_views_school_id_idx  ON public.material_views (school_id);
CREATE INDEX IF NOT EXISTS user_courses_school_id_idx    ON public.user_courses   (school_id);
CREATE INDEX IF NOT EXISTS school_requests_reviewed_by_idx ON public.school_requests (reviewed_by);
CREATE INDEX IF NOT EXISTS units_submitted_by_idx ON public.units (submitted_by);
CREATE INDEX IF NOT EXISTS pending_school_admins_school_id_idx ON private.pending_school_admins (school_id);

COMMIT;
