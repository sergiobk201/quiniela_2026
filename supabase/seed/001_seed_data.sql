-- ============================================================
-- Quiniela 2026 — Seed Data
-- Run once on a fresh database after migrations 001 and 002.
-- Kickoff times are UTC (approximate — admin can adjust later).
-- ============================================================

-- ── GROUPS ──────────────────────────────────────────────────
INSERT INTO groups (name) VALUES
  ('A'), ('B'), ('C'), ('D'), ('E'), ('F'),
  ('G'), ('H'), ('I'), ('J'), ('K'), ('L');

-- ── TEAMS ───────────────────────────────────────────────────
-- Serial IDs 1–48 assigned in insertion order (group A → L)
INSERT INTO teams (name, code, group_id, group_position) VALUES
  -- Group A (group_id = 1)
  ('Mexico',               'MEX',  1, 1),
  ('South Africa',         'RSA',  1, 2),
  ('South Korea',          'KOR',  1, 3),
  ('Czechia',              'CZE',  1, 4),
  -- Group B (group_id = 2)
  ('Canada',               'CAN',  2, 1),
  ('Bosnia & Herzegovina', 'BIH',  2, 2),
  ('Qatar',                'QAT',  2, 3),
  ('Switzerland',          'SUI',  2, 4),
  -- Group C (group_id = 3)
  ('Brazil',               'BRA',  3, 1),
  ('Morocco',              'MAR',  3, 2),
  ('Haiti',                'HAI',  3, 3),
  ('Scotland',             'SCO',  3, 4),
  -- Group D (group_id = 4)
  ('United States',        'USA',  4, 1),
  ('Paraguay',             'PAR',  4, 2),
  ('Australia',            'AUS',  4, 3),
  ('Türkiye',              'TUR',  4, 4),
  -- Group E (group_id = 5)
  ('Germany',              'GER',  5, 1),
  ('Curaçao',              'CUW',  5, 2),
  ('Côte d''Ivoire',       'CIV',  5, 3),
  ('Ecuador',              'ECU',  5, 4),
  -- Group F (group_id = 6)
  ('Netherlands',          'NED',  6, 1),
  ('Japan',                'JPN',  6, 2),
  ('Tunisia',              'TUN',  6, 3),
  ('Sweden',               'SWE',  6, 4),
  -- Group G (group_id = 7)
  ('Belgium',              'BEL',  7, 1),
  ('Egypt',                'EGY',  7, 2),
  ('Iran',                 'IRN',  7, 3),
  ('New Zealand',          'NZL',  7, 4),
  -- Group H (group_id = 8)
  ('Spain',                'ESP',  8, 1),
  ('Cabo Verde',           'CPV',  8, 2),
  ('Saudi Arabia',         'KSA',  8, 3),
  ('Uruguay',              'URU',  8, 4),
  -- Group I (group_id = 9)
  ('France',               'FRA',  9, 1),
  ('Senegal',              'SEN',  9, 2),
  ('Iraq',                 'IRQ',  9, 3),
  ('Norway',               'NOR',  9, 4),
  -- Group J (group_id = 10)
  ('Argentina',            'ARG', 10, 1),
  ('Algeria',              'ALG', 10, 2),
  ('Austria',              'AUT', 10, 3),
  ('Jordan',               'JOR', 10, 4),
  -- Group K (group_id = 11)
  ('Portugal',             'POR', 11, 1),
  ('Uzbekistan',           'UZB', 11, 3),
  ('Colombia',             'COL', 11, 4),
  ('Congo DR',             'COD', 11, 2),
  -- Group L (group_id = 12)
  ('England',              'ENG', 12, 1),
  ('Croatia',              'CRO', 12, 2),
  ('Ghana',                'GHA', 12, 3),
  ('Panama',               'PAN', 12, 4);

-- ── GROUP STAGE MATCHES (72) ─────────────────────────────────
-- locked_at computed as scheduled_at - 1 hour via outer SELECT
INSERT INTO matches (home_team_id, away_team_id, stage, group_id, scheduled_at, locked_at, stage_multiplier)
SELECT
  home_team_id::int,
  away_team_id::int,
  stage::text,
  group_id::int,
  scheduled_at::timestamptz,
  scheduled_at::timestamptz - INTERVAL '1 hour',
  stage_multiplier::int
FROM (VALUES
  -- ── Group A ─────────────────────────────────────────────
  ( 1,  2, 'group', 1, '2026-06-11 20:00:00+00', 1),  -- Mexico vs South Africa
  ( 3,  4, 'group', 1, '2026-06-12 03:00:00+00', 1),  -- South Korea vs Czechia
  ( 4,  2, 'group', 1, '2026-06-18 16:00:00+00', 1),  -- Czechia vs South Africa
  ( 1,  3, 'group', 1, '2026-06-19 01:00:00+00', 1),  -- Mexico vs South Korea
  ( 4,  1, 'group', 1, '2026-06-25 01:00:00+00', 1),  -- Czechia vs Mexico       [MD3 simultaneous]
  ( 2,  3, 'group', 1, '2026-06-25 01:00:00+00', 1),  -- South Africa vs South Korea [MD3 simultaneous]
  -- ── Group B ─────────────────────────────────────────────
  ( 5,  6, 'group', 2, '2026-06-12 19:00:00+00', 1),  -- Canada vs Bosnia & Herzegovina
  ( 7,  8, 'group', 2, '2026-06-13 19:00:00+00', 1),  -- Qatar vs Switzerland
  ( 8,  6, 'group', 2, '2026-06-18 19:00:00+00', 1),  -- Switzerland vs Bosnia & Herzegovina
  ( 5,  7, 'group', 2, '2026-06-18 22:00:00+00', 1),  -- Canada vs Qatar
  ( 8,  5, 'group', 2, '2026-06-24 19:00:00+00', 1),  -- Switzerland vs Canada   [MD3 simultaneous]
  ( 6,  7, 'group', 2, '2026-06-24 19:00:00+00', 1),  -- Bosnia & Herzegovina vs Qatar [MD3 simultaneous]
  -- ── Group C ─────────────────────────────────────────────
  ( 9, 10, 'group', 3, '2026-06-13 22:00:00+00', 1),  -- Brazil vs Morocco
  (11, 12, 'group', 3, '2026-06-14 01:00:00+00', 1),  -- Haiti vs Scotland
  (12, 10, 'group', 3, '2026-06-19 22:00:00+00', 1),  -- Scotland vs Morocco
  ( 9, 11, 'group', 3, '2026-06-20 00:30:00+00', 1),  -- Brazil vs Haiti
  (12,  9, 'group', 3, '2026-06-24 22:00:00+00', 1),  -- Scotland vs Brazil      [MD3 simultaneous]
  (10, 11, 'group', 3, '2026-06-24 22:00:00+00', 1),  -- Morocco vs Haiti        [MD3 simultaneous]
  -- ── Group D ─────────────────────────────────────────────
  (13, 14, 'group', 4, '2026-06-13 01:00:00+00', 1),  -- USA vs Paraguay
  (15, 16, 'group', 4, '2026-06-13 04:00:00+00', 1),  -- Australia vs Türkiye
  (13, 15, 'group', 4, '2026-06-19 19:00:00+00', 1),  -- USA vs Australia
  (16, 14, 'group', 4, '2026-06-20 03:00:00+00', 1),  -- Türkiye vs Paraguay
  (16, 13, 'group', 4, '2026-06-26 02:00:00+00', 1),  -- Türkiye vs USA          [MD3 simultaneous]
  (14, 15, 'group', 4, '2026-06-26 02:00:00+00', 1),  -- Paraguay vs Australia   [MD3 simultaneous]
  -- ── Group E ─────────────────────────────────────────────
  (17, 18, 'group', 5, '2026-06-14 17:00:00+00', 1),  -- Germany vs Curaçao
  (19, 20, 'group', 5, '2026-06-14 23:00:00+00', 1),  -- Côte d''Ivoire vs Ecuador
  (17, 19, 'group', 5, '2026-06-20 20:00:00+00', 1),  -- Germany vs Côte d''Ivoire
  (20, 18, 'group', 5, '2026-06-21 00:00:00+00', 1),  -- Ecuador vs Curaçao
  (18, 19, 'group', 5, '2026-06-25 20:00:00+00', 1),  -- Curaçao vs Côte d''Ivoire [MD3 simultaneous]
  (20, 17, 'group', 5, '2026-06-25 20:00:00+00', 1),  -- Ecuador vs Germany      [MD3 simultaneous]
  -- ── Group F ─────────────────────────────────────────────
  (21, 22, 'group', 6, '2026-06-14 20:00:00+00', 1),  -- Netherlands vs Japan
  (24, 23, 'group', 6, '2026-06-15 02:00:00+00', 1),  -- Sweden vs Tunisia
  (21, 24, 'group', 6, '2026-06-20 17:00:00+00', 1),  -- Netherlands vs Sweden
  (23, 22, 'group', 6, '2026-06-20 04:00:00+00', 1),  -- Tunisia vs Japan
  (22, 24, 'group', 6, '2026-06-25 23:00:00+00', 1),  -- Japan vs Sweden         [MD3 simultaneous]
  (23, 21, 'group', 6, '2026-06-25 23:00:00+00', 1),  -- Tunisia vs Netherlands  [MD3 simultaneous]
  -- ── Group G ─────────────────────────────────────────────
  (25, 26, 'group', 7, '2026-06-15 19:00:00+00', 1),  -- Belgium vs Egypt
  (27, 28, 'group', 7, '2026-06-16 01:00:00+00', 1),  -- Iran vs New Zealand
  (25, 27, 'group', 7, '2026-06-21 19:00:00+00', 1),  -- Belgium vs Iran
  (28, 26, 'group', 7, '2026-06-22 01:00:00+00', 1),  -- New Zealand vs Egypt
  (26, 27, 'group', 7, '2026-06-27 03:00:00+00', 1),  -- Egypt vs Iran           [MD3 simultaneous]
  (28, 25, 'group', 7, '2026-06-27 03:00:00+00', 1),  -- New Zealand vs Belgium  [MD3 simultaneous]
  -- ── Group H ─────────────────────────────────────────────
  (29, 30, 'group', 8, '2026-06-15 16:00:00+00', 1),  -- Spain vs Cabo Verde
  (31, 32, 'group', 8, '2026-06-15 22:00:00+00', 1),  -- Saudi Arabia vs Uruguay
  (29, 31, 'group', 8, '2026-06-21 16:00:00+00', 1),  -- Spain vs Saudi Arabia
  (32, 30, 'group', 8, '2026-06-21 22:00:00+00', 1),  -- Uruguay vs Cabo Verde
  (30, 31, 'group', 8, '2026-06-27 00:00:00+00', 1),  -- Cabo Verde vs Saudi Arabia [MD3 simultaneous]
  (32, 29, 'group', 8, '2026-06-27 00:00:00+00', 1),  -- Uruguay vs Spain        [MD3 simultaneous]
  -- ── Group I ─────────────────────────────────────────────
  (33, 34, 'group', 9, '2026-06-16 19:00:00+00', 1),  -- France vs Senegal
  (35, 36, 'group', 9, '2026-06-16 22:00:00+00', 1),  -- Iraq vs Norway
  (33, 35, 'group', 9, '2026-06-22 21:00:00+00', 1),  -- France vs Iraq
  (36, 34, 'group', 9, '2026-06-23 00:00:00+00', 1),  -- Norway vs Senegal
  (36, 33, 'group', 9, '2026-06-26 19:00:00+00', 1),  -- Norway vs France        [MD3 simultaneous]
  (34, 35, 'group', 9, '2026-06-26 19:00:00+00', 1),  -- Senegal vs Iraq         [MD3 simultaneous]
  -- ── Group J ─────────────────────────────────────────────
  (37, 38, 'group', 10, '2026-06-17 01:00:00+00', 1), -- Argentina vs Algeria
  (39, 40, 'group', 10, '2026-06-16 04:00:00+00', 1), -- Austria vs Jordan
  (37, 39, 'group', 10, '2026-06-22 17:00:00+00', 1), -- Argentina vs Austria
  (40, 38, 'group', 10, '2026-06-23 03:00:00+00', 1), -- Jordan vs Algeria
  (40, 37, 'group', 10, '2026-06-28 02:00:00+00', 1), -- Jordan vs Argentina     [MD3 simultaneous]
  (38, 39, 'group', 10, '2026-06-28 02:00:00+00', 1), -- Algeria vs Austria      [MD3 simultaneous]
  -- ── Group K ─────────────────────────────────────────────
  (41, 44, 'group', 11, '2026-06-17 17:00:00+00', 1), -- Portugal vs Congo DR
  (42, 43, 'group', 11, '2026-06-18 02:00:00+00', 1), -- Uzbekistan vs Colombia
  (41, 42, 'group', 11, '2026-06-23 17:00:00+00', 1), -- Portugal vs Uzbekistan
  (43, 44, 'group', 11, '2026-06-24 02:00:00+00', 1), -- Colombia vs Congo DR
  (43, 41, 'group', 11, '2026-06-27 23:30:00+00', 1), -- Colombia vs Portugal    [MD3 simultaneous]
  (44, 42, 'group', 11, '2026-06-27 23:30:00+00', 1), -- Congo DR vs Uzbekistan  [MD3 simultaneous]
  -- ── Group L ─────────────────────────────────────────────
  (45, 46, 'group', 12, '2026-06-17 20:00:00+00', 1), -- England vs Croatia
  (47, 48, 'group', 12, '2026-06-17 23:00:00+00', 1), -- Ghana vs Panama
  (45, 47, 'group', 12, '2026-06-23 20:00:00+00', 1), -- England vs Ghana
  (48, 46, 'group', 12, '2026-06-23 23:00:00+00', 1), -- Panama vs Croatia
  (48, 45, 'group', 12, '2026-06-27 21:00:00+00', 1), -- Panama vs England       [MD3 simultaneous]
  (46, 47, 'group', 12, '2026-06-27 21:00:00+00', 1)  -- Croatia vs Ghana        [MD3 simultaneous]
) AS v(home_team_id, away_team_id, stage, group_id, scheduled_at, stage_multiplier);

-- ── KNOCKOUT STAGE MATCHES (32) ──────────────────────────────
-- Teams TBD — admin populates home/away IDs as teams advance
INSERT INTO matches (home_team_id, away_team_id, stage, group_id, scheduled_at, locked_at, stage_multiplier)
SELECT
  NULL,
  NULL,
  stage::text,
  NULL,
  scheduled_at::timestamptz,
  scheduled_at::timestamptz - INTERVAL '1 hour',
  stage_multiplier::int
FROM (VALUES
  -- Round of 32 (16 matches, multiplier=2) — June 28–July 3
  ('r32', '2026-06-28 19:00:00+00', 2),
  ('r32', '2026-06-28 22:00:00+00', 2),
  ('r32', '2026-06-29 01:00:00+00', 2),
  ('r32', '2026-06-29 19:00:00+00', 2),
  ('r32', '2026-06-29 22:00:00+00', 2),
  ('r32', '2026-06-30 01:00:00+00', 2),
  ('r32', '2026-06-30 19:00:00+00', 2),
  ('r32', '2026-06-30 22:00:00+00', 2),
  ('r32', '2026-07-01 01:00:00+00', 2),
  ('r32', '2026-07-01 19:00:00+00', 2),
  ('r32', '2026-07-01 22:00:00+00', 2),
  ('r32', '2026-07-02 01:00:00+00', 2),
  ('r32', '2026-07-02 19:00:00+00', 2),
  ('r32', '2026-07-02 22:00:00+00', 2),
  ('r32', '2026-07-03 01:00:00+00', 2),
  ('r32', '2026-07-03 19:00:00+00', 2),
  -- Round of 16 (8 matches, multiplier=3) — July 4–7
  ('r16', '2026-07-04 19:00:00+00', 3),
  ('r16', '2026-07-04 22:00:00+00', 3),
  ('r16', '2026-07-05 01:00:00+00', 3),
  ('r16', '2026-07-05 19:00:00+00', 3),
  ('r16', '2026-07-06 19:00:00+00', 3),
  ('r16', '2026-07-06 22:00:00+00', 3),
  ('r16', '2026-07-07 01:00:00+00', 3),
  ('r16', '2026-07-07 19:00:00+00', 3),
  -- Quarter-Finals (4 matches, multiplier=4) — July 9–11
  ('qf', '2026-07-09 19:00:00+00', 4),
  ('qf', '2026-07-09 22:00:00+00', 4),
  ('qf', '2026-07-10 22:00:00+00', 4),
  ('qf', '2026-07-11 22:00:00+00', 4),
  -- Semi-Finals (2 matches, multiplier=5) — July 14–15
  ('sf', '2026-07-14 22:00:00+00', 5),
  ('sf', '2026-07-15 22:00:00+00', 5),
  -- Third Place (1 match, multiplier=5) — July 18
  ('3rd', '2026-07-18 22:00:00+00', 5),
  -- Final (1 match, multiplier=7) — July 19 local / July 20 UTC
  ('final', '2026-07-20 01:00:00+00', 7)
) AS v(stage, scheduled_at, stage_multiplier);
