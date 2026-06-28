-- R32 community bets: user picks + admin answers
ALTER TABLE pre_tournament_predictions
  ADD COLUMN IF NOT EXISTS r32_usa_to_r16          BOOLEAN,
  ADD COLUMN IF NOT EXISTS r32_worst_predictor      TEXT,
  ADD COLUMN IF NOT EXISTS r32_worst_ranked_team_id INT REFERENCES teams(id);

ALTER TABLE tournament_results
  ADD COLUMN IF NOT EXISTS r32_usa_to_r16          BOOLEAN,
  ADD COLUMN IF NOT EXISTS r32_worst_predictor      TEXT,
  ADD COLUMN IF NOT EXISTS r32_worst_ranked_team_id INT REFERENCES teams(id);
