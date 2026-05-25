-- ============================================================
-- Quiniela 2026 — Row Level Security Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_tournament_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standing_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_place_qualifier_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE champion_rebuys ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Reference data: public read
CREATE POLICY "Teams are public" ON teams FOR SELECT USING (TRUE);
CREATE POLICY "Groups are public" ON groups FOR SELECT USING (TRUE);
CREATE POLICY "Matches are public" ON matches FOR SELECT USING (TRUE);

-- Profiles: users read their own; admin reads all
CREATE POLICY "Read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin reads all profiles" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- No self-registration: only admin inserts profiles
CREATE POLICY "Admin creates profiles" ON profiles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admin updates profiles" ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Match predictions: own read/write always; others visible only after lock
CREATE POLICY "Own match predictions rw" ON match_predictions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Predictions visible after lock" ON match_predictions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.locked_at < NOW()
    )
  );

-- Pre-tournament predictions: own rw; visible after Jun 4 lock
CREATE POLICY "Own pre-tournament rw" ON pre_tournament_predictions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Pre-tournament visible after lock" ON pre_tournament_predictions FOR SELECT
  USING (auth.uid() = user_id OR locked = TRUE);

-- Group standing predictions: same pattern
CREATE POLICY "Own group standings rw" ON group_standing_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Third-place qualifier predictions
CREATE POLICY "Own qualifier predictions rw" ON third_place_qualifier_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Champion rebuys: own only
CREATE POLICY "Own rebuy rw" ON champion_rebuys FOR ALL
  USING (auth.uid() = user_id);

-- Scores: public read (leaderboard)
CREATE POLICY "Scores are public" ON scores FOR SELECT USING (TRUE);

-- Audit log: admin only
CREATE POLICY "Admin audit access" ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "System inserts audit" ON audit_log FOR INSERT WITH CHECK (TRUE);
