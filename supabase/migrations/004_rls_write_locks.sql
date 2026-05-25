-- ============================================================
-- Quiniela 2026 — Migration 004: RLS Write-Lock Enforcement
-- ============================================================
-- Gap fixed: all 4 prediction tables had FOR ALL policies that
-- allowed INSERT/UPDATE after the relevant lock time. A user with
-- a valid JWT could bypass the UI and write predictions directly
-- to the PostgREST API after locks fired. This migration splits
-- each FOR ALL into explicit per-operation policies and adds lock
-- enforcement on INSERT/UPDATE/DELETE at the DB level.
-- ============================================================

-- ============================================================
-- 1. match_predictions
-- ============================================================
-- Drop the catch-all. The SELECT side is kept via the existing
-- "Predictions visible after lock" policy (own + post-lock).
DROP POLICY IF EXISTS "Own match predictions rw" ON match_predictions;

-- INSERT: own rows, only when match is not yet locked
CREATE POLICY "match_predictions_insert" ON match_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.locked_at > NOW()
    )
  );

-- UPDATE: own rows, only when match is not yet locked
CREATE POLICY "match_predictions_update" ON match_predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id AND m.locked_at > NOW()
    )
  );

-- DELETE: own rows only (no lock constraint — removing a prediction is fine)
CREATE POLICY "match_predictions_delete" ON match_predictions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 2. pre_tournament_predictions
-- ============================================================
DROP POLICY IF EXISTS "Own pre-tournament rw" ON pre_tournament_predictions;

-- INSERT: own row, only before the June 4 pre-tournament deadline.
-- Using a hardcoded timestamp because no existing row to check locked col.
CREATE POLICY "pre_tournament_insert" ON pre_tournament_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < '2026-06-04T00:00:00Z'::timestamptz
  );

-- UPDATE: own row, only while admin hasn't set locked = TRUE
CREATE POLICY "pre_tournament_update" ON pre_tournament_predictions FOR UPDATE
  USING (auth.uid() = user_id AND locked = FALSE)
  WITH CHECK (auth.uid() = user_id AND locked = FALSE);

-- DELETE: own row, only while not locked
CREATE POLICY "pre_tournament_delete" ON pre_tournament_predictions FOR DELETE
  USING (auth.uid() = user_id AND locked = FALSE);


-- ============================================================
-- 3. group_standing_predictions
-- ============================================================
DROP POLICY IF EXISTS "Own group standings rw" ON group_standing_predictions;

CREATE POLICY "group_standings_select" ON group_standing_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "group_standings_insert" ON group_standing_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < '2026-06-04T00:00:00Z'::timestamptz
  );

CREATE POLICY "group_standings_update" ON group_standing_predictions FOR UPDATE
  USING (auth.uid() = user_id AND NOW() < '2026-06-04T00:00:00Z'::timestamptz)
  WITH CHECK (auth.uid() = user_id AND NOW() < '2026-06-04T00:00:00Z'::timestamptz);

CREATE POLICY "group_standings_delete" ON group_standing_predictions FOR DELETE
  USING (auth.uid() = user_id AND NOW() < '2026-06-04T00:00:00Z'::timestamptz);


-- ============================================================
-- 4. third_place_qualifier_predictions
-- ============================================================
DROP POLICY IF EXISTS "Own qualifier predictions rw" ON third_place_qualifier_predictions;

CREATE POLICY "qualifier_select" ON third_place_qualifier_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "qualifier_insert" ON third_place_qualifier_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < '2026-06-04T00:00:00Z'::timestamptz
  );

CREATE POLICY "qualifier_update" ON third_place_qualifier_predictions FOR UPDATE
  USING (auth.uid() = user_id AND NOW() < '2026-06-04T00:00:00Z'::timestamptz)
  WITH CHECK (auth.uid() = user_id AND NOW() < '2026-06-04T00:00:00Z'::timestamptz);

CREATE POLICY "qualifier_delete" ON third_place_qualifier_predictions FOR DELETE
  USING (auth.uid() = user_id AND NOW() < '2026-06-04T00:00:00Z'::timestamptz);
