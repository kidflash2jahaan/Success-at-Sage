-- Rename schools.contest_enabled -> schools.prize_enabled.
-- Semantics flipped: the contest (leaderboard, ranks, stats) is always on
-- for every school. What this flag now gates is whether a PRIZE is shown
-- anywhere (banners, OG images, dashboard callouts). Admins toggle it from
-- /s/[slug]/admin/contest.
ALTER TABLE schools RENAME COLUMN contest_enabled TO prize_enabled;
