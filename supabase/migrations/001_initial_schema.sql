-- ============================================================
-- Quiniela 2026 — Initial Schema
-- ============================================================

-- GROUPS (A–L)
CREATE TABLE groups (
  id   SERIAL PRIMARY KEY,
  name CHAR(1) NOT NULL UNIQUE
);

-- TEAMS
CREATE TABLE teams (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  code           CHAR(3) NOT NULL UNIQUE,
  flag_url       TEXT,
  fifa_ranking   INT,
  group_id       INT REFERENCES groups(id),
  group_position INT CHECK (group_position BETWEEN 1 AND 4)
);

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  is_admin     BOOLEAN DEFAULT FALSE,
  entry_paid   BOOLEAN DEFAULT FALSE,
  invite_code  TEXT UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- MATCHES
CREATE TABLE matches (
  id               SERIAL PRIMARY KEY,
  home_team_id     INT REFERENCES teams(id),
  away_team_id     INT REFERENCES teams(id),
  stage            TEXT NOT NULL CHECK (stage IN ('group','r32','r16','qf','sf','3rd','final')),
  group_id         INT REFERENCES groups(id),
  scheduled_at     TIMESTAMPTZ NOT NULL,
  locked_at        TIMESTAMPTZ NOT NULL,
  home_score       INT,
  away_score       INT,
  status           TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished')),
  upset            BOOLEAN,
  stage_multiplier NUMERIC NOT NULL DEFAULT 1,
  CONSTRAINT different_teams CHECK (home_team_id <> away_team_id)
);

-- PRE-TOURNAMENT PREDICTIONS
CREATE TABLE pre_tournament_predictions (
  id                      SERIAL PRIMARY KEY,
  user_id                 UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  champion_team_id        INT REFERENCES teams(id),
  runner_up_team_id       INT REFERENCES teams(id),
  third_place_team_id     INT REFERENCES teams(id),
  golden_boot_player      TEXT,
  golden_glove_player     TEXT,
  kopa_player             TEXT,
  total_goals_prediction  INT,
  first_eliminated_team_id INT REFERENCES teams(id),
  most_yellows_team_id    INT REFERENCES teams(id),
  locked                  BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- GROUP STANDING PREDICTIONS
CREATE TABLE group_standing_predictions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id      INT REFERENCES groups(id),
  predicted_1st INT REFERENCES teams(id),
  predicted_2nd INT REFERENCES teams(id),
  predicted_3rd INT REFERENCES teams(id),
  predicted_4th INT REFERENCES teams(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, group_id)
);

-- THIRD-PLACE QUALIFIER PREDICTIONS
CREATE TABLE third_place_qualifier_predictions (
  id         SERIAL PRIMARY KEY,
  user_id    UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  team_ids   INT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATCH PREDICTIONS
CREATE TABLE match_predictions (
  id                    SERIAL PRIMARY KEY,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id              INT REFERENCES matches(id),
  predicted_home_score  INT NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score  INT NOT NULL CHECK (predicted_away_score >= 0),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

-- CHAMPION REBUYS
CREATE TABLE champion_rebuys (
  id                 SERIAL PRIMARY KEY,
  user_id            UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  team_id            INT REFERENCES teams(id),
  unlocked_at_stage  TEXT NOT NULL,
  points_available   INT NOT NULL,
  submitted_at       TIMESTAMPTZ
);

-- SCORES (cached)
CREATE TABLE scores (
  id                   SERIAL PRIMARY KEY,
  user_id              UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  pre_tournament_points INT DEFAULT 0,
  group_stage_points    INT DEFAULT 0,
  knockout_points       INT DEFAULT 0,
  rebuy_points          INT DEFAULT 0,
  total_points          INT DEFAULT 0,
  last_computed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG (insert-only)
CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id),
  action     TEXT NOT NULL,
  table_name TEXT,
  record_id  INT,
  old_value  JSONB,
  new_value  JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-update updated_at on match_predictions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_predictions_updated_at
  BEFORE UPDATE ON match_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pre_tournament_updated_at
  BEFORE UPDATE ON pre_tournament_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: log score changes to audit_log
CREATE OR REPLACE FUNCTION log_score_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_value, new_value)
  VALUES (NEW.user_id, 'score_updated', 'scores', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scores_audit
  AFTER UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION log_score_change();
