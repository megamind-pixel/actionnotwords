-- =============================================
-- ANW Student Performance Tracker — Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ADMINS ──
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCHOOLS ──
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT CHECK (type IN ('ecde','primary','secondary','mixed','tertiary')),
  curriculum TEXT DEFAULT 'cbc' CHECK (curriculum IN ('cbc','844','both')),
  contact_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── STUDENTS ──
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('ecde','lower_primary','upper_primary','junior_secondary','secondary','tertiary')),
  class_name TEXT,
  ref_no TEXT UNIQUE,
  dob DATE,
  gender TEXT CHECK (gender IN ('Male','Female','Other')),
  parent_name TEXT,
  parent_phone TEXT,
  sponsorship_date DATE,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESULTS ──
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('1','2','3')),
  exam_type TEXT DEFAULT 'end_term' CHECK (exam_type IN ('end_term','mock','kcpe','kcse','kpsea','kjsea')),
  subjects JSONB NOT NULL DEFAULT '{}',
  position INTEGER,
  class_size INTEGER,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, year, term)
);

-- ── SETTINGS ──
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  org_name TEXT NOT NULL DEFAULT 'Actions Not Words',
  logo_url TEXT,
  current_year TEXT DEFAULT '2025',
  current_term TEXT DEFAULT '1',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_row CHECK (id = 1)
);

-- Seed initial settings
INSERT INTO settings (id, org_name) VALUES (1, 'Actions Not Words') ON CONFLICT DO NOTHING;

-- ── RLS POLICIES ──
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Admins can read/write everything (service role used from server)
-- Public: no access

-- ── INDEXES ──
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_year_term ON results(year, term);

-- ── SEED: Super Admin ──
-- After creating your first Supabase user, run:
-- INSERT INTO admins (user_id, email, name, role, status)
-- VALUES ('<your-user-id>', '<your-email>', 'Super Admin', 'super_admin', 'active');
