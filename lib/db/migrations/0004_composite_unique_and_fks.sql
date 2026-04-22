-- 0004_composite_unique_and_fks.sql
-- Phase 1 / Task 4: composite FKs for cross-tenant integrity. Children
-- can't reference parents in a different school at the DB level.
--
-- units.submitted_by (nullable admin-promotion FK, not tracked by
-- Drizzle) is intentionally NOT upgraded to a composite FK here — it
-- can be hardened later.

BEGIN;

-- Parents need UNIQUE (school_id, id) so FKs can reference them
ALTER TABLE users        ADD CONSTRAINT users_school_id_id_key        UNIQUE (school_id, id);
ALTER TABLE departments  ADD CONSTRAINT departments_school_id_id_key  UNIQUE (school_id, id);
ALTER TABLE courses      ADD CONSTRAINT courses_school_id_id_key      UNIQUE (school_id, id);
ALTER TABLE units        ADD CONSTRAINT units_school_id_id_key        UNIQUE (school_id, id);

-- courses.department_id
ALTER TABLE courses DROP CONSTRAINT courses_department_id_departments_id_fk;
ALTER TABLE courses
  ADD CONSTRAINT courses_department_fk
  FOREIGN KEY (school_id, department_id)
  REFERENCES departments (school_id, id);

-- units.course_id (preserve ON DELETE CASCADE)
ALTER TABLE units DROP CONSTRAINT units_course_id_courses_id_fk;
ALTER TABLE units
  ADD CONSTRAINT units_course_fk
  FOREIGN KEY (school_id, course_id)
  REFERENCES courses (school_id, id)
  ON DELETE CASCADE;

-- materials.unit_id (preserve ON DELETE CASCADE)
ALTER TABLE materials DROP CONSTRAINT materials_unit_id_units_id_fk;
ALTER TABLE materials
  ADD CONSTRAINT materials_unit_fk
  FOREIGN KEY (school_id, unit_id)
  REFERENCES units (school_id, id)
  ON DELETE CASCADE;

-- materials.uploaded_by
ALTER TABLE materials DROP CONSTRAINT materials_uploaded_by_users_id_fk;
ALTER TABLE materials
  ADD CONSTRAINT materials_uploaded_by_fk
  FOREIGN KEY (school_id, uploaded_by)
  REFERENCES users (school_id, id);

-- user_courses.user_id (preserve ON DELETE CASCADE)
ALTER TABLE user_courses DROP CONSTRAINT user_courses_user_id_users_id_fk;
ALTER TABLE user_courses
  ADD CONSTRAINT user_courses_user_fk
  FOREIGN KEY (school_id, user_id)
  REFERENCES users (school_id, id)
  ON DELETE CASCADE;

-- user_courses.course_id (preserve ON DELETE CASCADE)
ALTER TABLE user_courses DROP CONSTRAINT user_courses_course_id_courses_id_fk;
ALTER TABLE user_courses
  ADD CONSTRAINT user_courses_course_fk
  FOREIGN KEY (school_id, course_id)
  REFERENCES courses (school_id, id)
  ON DELETE CASCADE;

-- contest_winners.user_id
ALTER TABLE contest_winners DROP CONSTRAINT contest_winners_user_id_fkey;
ALTER TABLE contest_winners
  ADD CONSTRAINT contest_winners_user_fk
  FOREIGN KEY (school_id, user_id)
  REFERENCES users (school_id, id);

COMMIT;
