-- API Keys table for long-lived programmatic access tokens
-- Keys are stored as SHA-256 hashes; plaintext is shown once at creation

CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                    -- user-friendly label (e.g. "CI/CD pipeline")
  key_hash    TEXT NOT NULL UNIQUE,             -- SHA-256 hash of the plaintext key
  key_prefix  TEXT NOT NULL,                    -- first 8 chars for identification (e.g. "sc_live_a1b2")
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- RLS: users can only manage their own API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE USING (auth.uid() = user_id);
