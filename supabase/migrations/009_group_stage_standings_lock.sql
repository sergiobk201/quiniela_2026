-- ============================================================
-- Quiniela 2026 — Migration 009: Split standings/qualifiers lock
-- ============================================================
-- Previously group_standing_predictions and
-- third_place_qualifier_predictions were locked at the same
-- hardcoded timestamp as trophy picks (2026-06-07T00:00:00Z).
-- They now lock dynamically when the last group-stage match
-- locks (MAX(locked_at) WHERE stage = 'group'), giving players
-- the full group stage window to sync standings from their
-- match predictions.
-- Trophy picks (pre_tournament_predictions) remain on June 7.
-- ============================================================

-- ── group_standing_predictions ───────────────────────────────
DROP POLICY IF EXISTS "group_standings_insert" ON group_standing_predictions;
DROP POLICY IF EXISTS "group_standings_update" ON group_standing_predictions;
DROP POLICY IF EXISTS "group_standings_delete" ON group_standing_predictions;

CREATE POLICY "group_standings_insert" ON group_standing_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  );

CREATE POLICY "group_standings_update" ON group_standing_predictions FOR UPDATE
  USING (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  )
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  );

CREATE POLICY "group_standings_delete" ON group_standing_predictions FOR DELETE
  USING (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  );

-- ── third_place_qualifier_predictions ────────────────────────
DROP POLICY IF EXISTS "qualifier_insert" ON third_place_qualifier_predictions;
DROP POLICY IF EXISTS "qualifier_update" ON third_place_qualifier_predictions;
DROP POLICY IF EXISTS "qualifier_delete" ON third_place_qualifier_predictions;

CREATE POLICY "qualifier_insert" ON third_place_qualifier_predictions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  );

CREATE POLICY "qualifier_update" ON third_place_qualifier_predictions FOR UPDATE
  USING (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  )
  WITH CHECK (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  );

CREATE POLICY "qualifier_delete" ON third_place_qualifier_predictions FOR DELETE
  USING (
    auth.uid() = user_id AND
    NOW() < (SELECT MAX(locked_at) FROM matches WHERE stage = 'group')
  );
