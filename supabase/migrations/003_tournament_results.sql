-- ============================================================
-- Quiniela 2026 — Tournament Results + Match Winner Tracking
-- ============================================================

-- Admin fills this in as the tournament progresses and concludes
CREATE TABLE tournament_results (
  id                          SERIAL PRIMARY KEY,
  champion_team_id            INT REFERENCES teams(id),
  runner_up_team_id           INT REFERENCES teams(id),
  third_place_team_id         INT REFERENCES teams(id),
  golden_boot_player          TEXT,
  golden_glove_player         TEXT,
  kopa_player                 TEXT,
  total_goals                 INT,
  first_eliminated_team_id    INT REFERENCES teams(id),
  most_yellows_team_id        INT REFERENCES teams(id),
  -- 8 team IDs that advanced as best 3rd-place teams
  third_place_qualifier_ids   INT[],
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks which team actually advanced in knockout rounds
-- (needed when 90-min score is a draw and winner is via ET/penalties)
ALTER TABLE matches ADD COLUMN winner_team_id INT REFERENCES teams(id);

-- RLS
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (needed for scoring display)
CREATE POLICY "tournament_results_read"
  ON tournament_results FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can write (via Edge Function / admin server actions)
CREATE POLICY "tournament_results_admin_write"
  ON tournament_results FOR ALL
  TO service_role
  USING (true);
