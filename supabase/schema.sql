-- FINS Lead OS — Full Schema (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS leads (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  company        TEXT,
  email          TEXT,
  phone          TEXT,
  service        TEXT,
  status         TEXT DEFAULT 'new',
  notes          TEXT,
  follow_up_date TEXT,
  source         TEXT,
  assigned_rep   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id             TEXT PRIMARY KEY,
  client_name    TEXT NOT NULL,
  amount         NUMERIC DEFAULT 0,
  status         TEXT DEFAULT 'pending',
  due_date       TEXT,
  description    TEXT,
  invoice_number TEXT,
  is_recurring   BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id            TEXT PRIMARY KEY,
  url           TEXT,
  name          TEXT,
  date          TEXT,
  location      TEXT,
  description   TEXT,
  assigned_reps JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reps (
  id       TEXT PRIMARY KEY,
  name     TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  contact_name  TEXT,
  email         TEXT,
  phone         TEXT,
  service       TEXT,
  monthly_value NUMERIC,
  start_date    TEXT,
  notes         TEXT,
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO settings (key, value) VALUES ('admin_pin', 'fins') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('rep_code',  'reps') ON CONFLICT (key) DO NOTHING;

-- Add missing columns to existing tables if upgrading
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_rep TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_name TEXT, email TEXT, phone TEXT, service TEXT, monthly_value NUMERIC, start_date TEXT, notes TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW());

-- Disable RLS on all tables
ALTER TABLE leads    DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE events   DISABLE ROW LEVEL SECURITY;
ALTER TABLE reps     DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients  DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
