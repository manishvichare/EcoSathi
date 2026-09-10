-- ============================================================
-- EcoSathi Daily Eco Action Tasks — Database Migration V2
-- Run this ONCE in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vcthgckctineqrhhtslm/sql/new
-- ============================================================

-- 1. Table: task_submissions
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'rejected', 'more_evidence_required'
  )),
  evidence_type TEXT NOT NULL DEFAULT 'photo' CHECK (evidence_type IN (
    'photo', 'before_after', 'report_link', 'activity_log', 'document'
  )),
  evidence_url TEXT,
  before_evidence_url TEXT,
  description TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  linked_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id, task_date)
);

-- Index for fast lookup by user and status
CREATE INDEX IF NOT EXISTS idx_task_sub_user_date ON task_submissions(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_task_sub_status ON task_submissions(status);

-- 2. Table: task_evidence_history
-- Stores multi-round uploads when "More Evidence" is requested or resubmissions occur
CREATE TABLE IF NOT EXISTS task_evidence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
  evidence_url TEXT,
  before_evidence_url TEXT,
  description TEXT,
  action_type TEXT DEFAULT 'submission',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: point_transactions
-- Immutable ledger guaranteeing points are awarded exactly once per task submission
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reference_id, type)
);

-- 4. Seed a Cleanup task if not already present
INSERT INTO tasks (title, description, points, category, active)
SELECT 'Community Cleanup Drive', 'Organize or participate in a local cleanup. Submit Before & After photos.', 45, 'cleanup', true
WHERE NOT EXISTS (
  SELECT 1 FROM tasks WHERE category = 'cleanup' OR title ILIKE '%cleanup%'
);
