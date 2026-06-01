-- Add 6 new fun bet columns to pre_tournament_predictions.
-- All nullable; existing rows unaffected. No scoring changes.
ALTER TABLE pre_tournament_predictions
  ADD COLUMN IF NOT EXISTS first_goal_scorer             TEXT,
  ADD COLUMN IF NOT EXISTS first_red_card_player         TEXT,
  ADD COLUMN IF NOT EXISTS total_red_cards_prediction    INT,
  ADD COLUMN IF NOT EXISTS final_goes_to_penalties       BOOLEAN,
  ADD COLUMN IF NOT EXISTS total_own_goals_prediction    INT,
  ADD COLUMN IF NOT EXISTS most_goals_team_id            INT REFERENCES teams(id);
