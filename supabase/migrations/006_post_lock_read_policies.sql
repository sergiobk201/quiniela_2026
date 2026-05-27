-- ============================================================
-- Quiniela 2026 — Migration 006: Post-Lock Cross-User Read Policies
-- ============================================================
-- Enables the picks comparison grid on /leaderboard and the
-- daily prediction grid. Any authenticated user can read another
-- user's predictions once the relevant lock has fired.
--
-- Already handled (no changes needed):
--   match_predictions     — "Predictions visible after lock" (002)
--   pre_tournament_predictions — "Pre-tournament visible after lock" (002)
--
-- Tables updated here:
--   group_standing_predictions       — own-only → post-lock cross-user
--   third_place_qualifier_predictions — own-only → post-lock cross-user
--   champion_rebuys                  — split FOR ALL into per-op + cross-user SELECT
-- ============================================================


-- ============================================================
-- 1. group_standing_predictions
-- ============================================================
-- Migration 004 set this to own-row-only. Open to all auth users
-- post-pre-tournament lock (June 7 deadline or admin lock).
DROP POLICY IF EXISTS "group_standings_select" ON group_standing_predictions;

CREATE POLICY "group_standings_select" ON group_standing_predictions FOR SELECT
  USING (
    auth.uid() = user_id
    OR NOW() >= '2026-06-07T00:00:00Z'::timestamptz
    OR EXISTS (
      SELECT 1 FROM pre_tournament_predictions p
      WHERE p.user_id = group_standing_predictions.user_id
        AND p.locked = TRUE
    )
  );


-- ============================================================
-- 2. third_place_qualifier_predictions
-- ============================================================
DROP POLICY IF EXISTS "qualifier_select" ON third_place_qualifier_predictions;

CREATE POLICY "qualifier_select" ON third_place_qualifier_predictions FOR SELECT
  USING (
    auth.uid() = user_id
    OR NOW() >= '2026-06-07T00:00:00Z'::timestamptz
    OR EXISTS (
      SELECT 1 FROM pre_tournament_predictions p
      WHERE p.user_id = third_place_qualifier_predictions.user_id
        AND p.locked = TRUE
    )
  );


-- ============================================================
-- 3. champion_rebuys
-- ============================================================
-- Migration 002 used FOR ALL (own-only). Split into per-op policies
-- so SELECT can be opened post-lock without affecting write safety.
DROP POLICY IF EXISTS "Own rebuy rw" ON champion_rebuys;

-- Own row always; others visible post-pre-tournament lock
-- (rebuys only happen during the tournament, after June 7)
CREATE POLICY "rebuy_select" ON champion_rebuys FOR SELECT
  USING (
    auth.uid() = user_id
    OR NOW() >= '2026-06-07T00:00:00Z'::timestamptz
  );

CREATE POLICY "rebuy_insert" ON champion_rebuys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rebuy_update" ON champion_rebuys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rebuy_delete" ON champion_rebuys FOR DELETE
  USING (auth.uid() = user_id);
