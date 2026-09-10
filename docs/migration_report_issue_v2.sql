-- ============================================================
-- EcoSathi Report Issue System — Database Migration
-- Run this ONCE in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vcthgckctineqrhhtslm/sql/new
-- ============================================================

-- 1. Expand status constraint to support the full lifecycle
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
  CHECK (status IN (
    'analyzed', 'open', 'under_review', 'verified', 'action_required',
    'assigned', 'authority_notified', 'action_in_progress',
    'resolution_pending', 'resolved', 'rejected', 'duplicate'
  ));

-- Normalize: treat old 'analyzed' as 'open' going forward
UPDATE complaints SET status = 'open' WHERE status = 'analyzed';

-- 2. complaint_supports — one support per user per report (UNIQUE enforced)
CREATE TABLE IF NOT EXISTS complaint_supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(complaint_id, user_id)
);

-- 3. complaint_help_actions — typed help commitments (one active per user per report)
CREATE TABLE IF NOT EXISTS complaint_help_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  help_type TEXT NOT NULL CHECK (help_type IN (
    'visit_location', 'provide_photos', 'provide_information',
    'help_cleanup', 'contact_authority', 'volunteer_action'
  )),
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(complaint_id, user_id)
);

-- 4. complaint_evidence — multi-type photo evidence per report
CREATE TABLE IF NOT EXISTS complaint_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  uploader_name TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'original', 'additional', 'verification', 'action', 'resolution'
  )),
  photo_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Backfill: copy original complaint photos as 'original' evidence records
INSERT INTO complaint_evidence (complaint_id, uploaded_by, evidence_type, photo_url, description, created_at)
SELECT c.id, c.user_id, 'original', c.photo_url, 'Original complaint photo submitted by citizen', c.created_at
FROM complaints c
WHERE c.photo_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. complaint_activity — real event-by-event timeline
CREATE TABLE IF NOT EXISTS complaint_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  actor_name TEXT,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. complaint_assignments — admin-assigned action tasks
CREATE TABLE IF NOT EXISTS complaint_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_by_name TEXT,
  assignee_name TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'site_verification', 'evidence_collection', 'additional_investigation',
    'cleanup', 'community_outreach', 'authority_contact', 'on_ground_action',
    'follow_up_inspection', 'resolution_verification'
  )),
  instructions TEXT,
  deadline DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'overdue'
  )),
  completion_description TEXT,
  completion_evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. complaint_authority — authority case reference tracking
CREATE TABLE IF NOT EXISTS complaint_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  reference_number TEXT,
  submitted_date DATE,
  submission_status TEXT DEFAULT 'not_submitted' CHECK (submission_status IN (
    'not_submitted', 'submitted', 'acknowledged', 'in_progress', 'closed'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. complaint_authority_responses — authority reply history
CREATE TABLE IF NOT EXISTS complaint_authority_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id UUID NOT NULL REFERENCES complaint_authority(id) ON DELETE CASCADE,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES users(id),
  recorded_by_name TEXT,
  response_text TEXT NOT NULL,
  response_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. complaint_resolutions — resolution submissions requiring verification
CREATE TABLE IF NOT EXISTS complaint_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES users(id),
  submitted_by_name TEXT,
  resolution_type TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_by_name TEXT,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Seed initial activity for existing complaints
INSERT INTO complaint_activity (complaint_id, actor_id, actor_name, event_type, description, created_at)
SELECT c.id, c.user_id, u.name, 'report_submitted', 
  'Environmental issue reported with photographic evidence.',
  c.created_at
FROM complaints c
LEFT JOIN users u ON u.id = c.user_id
ON CONFLICT DO NOTHING;
