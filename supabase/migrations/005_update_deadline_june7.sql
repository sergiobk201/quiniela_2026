-- ============================================================
-- Quiniela 2026 — Migration 005: Extend deadline to June 7
-- ============================================================
-- Updates the hardcoded pre-tournament lock timestamp from
-- 2026-06-04T00:00:00Z to 2026-06-07T00:00:00Z across all 4
-- pre-tournament-related RLS policies.
-- ============================================================

-- pre_tournament_predictions
DROP POLICY IF EXISTS "pre_tournament_insert" ON pre_tournament_predictions;
CREATE POLICY "pre_tournament_insert" ON pre_tournament_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < '2026-06-07T00:00:00Z'::timestamptz
  );

-- group_standing_predictions
DROP POLICY IF EXISTS "group_standings_insert" ON group_standing_predictions;
DROP POLICY IF EXISTS "group_standings_update" ON group_standing_predictions;
DROP POLICY IF EXISTS "group_standings_delete" ON group_standing_predictions;

CREATE POLICY "group_standings_insert" ON group_standing_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < '2026-06-07T00:00:00Z'::timestamptz
  );

CREATE POLICY "group_standings_update" ON group_standing_predictions FOR UPDATE
  USING (auth.uid() = user_id AND NOW() < '2026-06-07T00:00:00Z'::timestamptz)
  WITH CHECK (auth.uid() = user_id AND NOW() < '2026-06-07T00:00:00Z'::timestamptz);

CREATE POLICY "group_standings_delete" ON group_standing_predictions FOR DELETE
  USING (auth.uid() = user_id AND NOW() < '2026-06-07T00:00:00Z'::timestamptz);

-- third_place_qualifier_predictions
DROP POLICY IF EXISTS "qualifier_insert" ON third_place_qualifier_predictions;
DROP POLICY IF EXISTS "qualifier_update" ON third_place_qualifier_predictions;
DROP POLICY IF EXISTS "qualifier_delete" ON third_place_qualifier_predictions;

CREATE POLICY "qualifier_insert" ON third_place_qualifier_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < '2026-06-07T00:00:00Z'::timestamptz
  );

CREATE POLICY "qualifier_update" ON third_place_qualifier_predictions FOR UPDATE
  USING (auth.uid() = user_id AND NOW() < '2026-06-07T00:00:00Z'::timestamptz)
  WITH CHECK (auth.uid() = user_id AND NOW() < '2026-06-07T00:00:00Z'::timestamptz);

CREATE POLICY "qualifier_delete" ON third_place_qualifier_predictions FOR DELETE
  USING (auth.uid() = user_id AND NOW() < '2026-06-07T00:00:00Z'::timestamptz);
