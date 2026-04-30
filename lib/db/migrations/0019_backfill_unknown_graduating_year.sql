-- Backfill: any user whose school email doesn't start with two digits gets
-- their graduating_year set to 0 (UNKNOWN_GRADUATING_YEAR sentinel →
-- calculateGrade() displays as "Other").
--
-- Why: the `deriveGraduatingYearFromEmail` helper (commit 5a86c6c) made the
-- email's two-digit prefix the source of truth for new signups. But existing
-- users created via the old dropdown form retained whatever year they
-- selected, even if their email had no prefix (faculty / staff / non-student
-- accounts). Without this backfill, those rows display as Freshman / Senior /
-- etc. depending on the stored year, which is misleading.
--
-- Admins retain the ability to override per-user via the user-edit page —
-- this is a one-time data correction, not a runtime enforcement (i.e. no
-- trigger, no constraint).

UPDATE users
SET graduating_year = 0
WHERE email !~ '^\d{2}'
  AND graduating_year <> 0;
