-- Knockout tiebreaker: who the user predicts advances via ET/penalties.
-- Only scored by compute-scores when the actual 90-min result is also a draw
-- (matches.winner_team_id is set). Nullable — only relevant for draw predictions
-- in knockout matches; ignored entirely for group stage and regulation wins.
ALTER TABLE match_predictions
  ADD COLUMN predicted_winner_team_id INT REFERENCES teams(id);
