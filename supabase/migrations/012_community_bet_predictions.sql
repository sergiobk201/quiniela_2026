-- Add 3 winning community bet prediction columns to pre_tournament_predictions.
-- These lock 1h before the first group-stage match (Jun 11), independent of
-- the trophy lock (Jun 7) that already fired.
ALTER TABLE pre_tournament_predictions
  ADD COLUMN IF NOT EXISTS community_balon_de_oro        TEXT,
  ADD COLUMN IF NOT EXISTS community_revelacion_team_id  INT REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS community_decepcion_team_id   INT REFERENCES teams(id);

-- Answer columns on tournament_results so the scoring engine can compare.
ALTER TABLE tournament_results
  ADD COLUMN IF NOT EXISTS community_balon_de_oro        TEXT,
  ADD COLUMN IF NOT EXISTS community_revelacion_team_id  INT REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS community_decepcion_team_id   INT REFERENCES teams(id);
