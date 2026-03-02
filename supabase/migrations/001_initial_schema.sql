-- SmartCloud Secrets Manager - Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE secrets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name        TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,   -- base64 AES-256-GCM ciphertext
  iv              TEXT NOT NULL,   -- base64, 12 bytes, unique per encryption
  auth_tag        TEXT NOT NULL,   -- base64, 16 bytes, GCM tamper detection
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, key_name)
);

CREATE TABLE access_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_id   UUID NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL,
  key_name    TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('READ','CREATE','UPDATE','DELETE')),
  ip_address  TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_secrets_project_id ON secrets(project_id);
CREATE INDEX idx_secrets_user_id ON secrets(user_id);
CREATE INDEX idx_secrets_key_name ON secrets(project_id, key_name);
CREATE INDEX idx_access_logs_secret_id ON access_logs(secret_id);
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at
  BEFORE UPDATE ON secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Projects: users can only access their own
CREATE POLICY "projects_select" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Secrets: users can only access their own
CREATE POLICY "secrets_select" ON secrets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "secrets_insert" ON secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "secrets_update" ON secrets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "secrets_delete" ON secrets FOR DELETE USING (auth.uid() = user_id);

-- Access logs: users can view their own; inserts are done via service role (server-side only)
CREATE POLICY "access_logs_select" ON access_logs FOR SELECT USING (auth.uid() = user_id);
