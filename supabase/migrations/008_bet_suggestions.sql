-- Migration: community bet suggestions + votes

CREATE TABLE IF NOT EXISTS bet_suggestions (
  id         SERIAL PRIMARY KEY,
  phase      TEXT NOT NULL CHECK (phase IN ('pre_tournament','group','r32','r16','qf','sf','final')),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','expert')),
  status     TEXT DEFAULT 'open' CHECK (status IN ('open','selected','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bet_suggestion_votes (
  id            SERIAL PRIMARY KEY,
  suggestion_id INT REFERENCES bet_suggestions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (suggestion_id, user_id)
);

ALTER TABLE bet_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_suggestion_votes ENABLE ROW LEVEL SECURITY;

-- Suggestions: any authenticated user can read and submit their own
CREATE POLICY "auth_read_suggestions"
  ON bet_suggestions FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_own_suggestion"
  ON bet_suggestions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Votes: any authenticated user can read; insert/delete own
CREATE POLICY "auth_read_votes"
  ON bet_suggestion_votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_own_vote"
  ON bet_suggestion_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "auth_delete_own_vote"
  ON bet_suggestion_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
