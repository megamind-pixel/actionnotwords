-- =============================================
-- ANW Student Tracker — Migration: Simplified Results
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add mean_score column (the single overall mean entered by admin)
ALTER TABLE results ADD COLUMN IF NOT EXISTS mean_score NUMERIC(5,2);

-- 2. Add score_proof_url column (URL to uploaded proof image)
ALTER TABLE results ADD COLUMN IF NOT EXISTS score_proof_url TEXT;

-- 3. Back-fill mean_score from existing subjects JSONB data
-- This calculates the average of all subject marks already in the database
UPDATE results
SET mean_score = (
  SELECT ROUND(AVG(val::numeric))
  FROM jsonb_each_text(subjects) AS kv(key, val)
  WHERE val ~ '^[0-9]+(\.[0-9]+)?$'
    AND val::numeric >= 0
)
WHERE mean_score IS NULL
  AND subjects IS NOT NULL
  AND subjects != '{}';

-- 4. Create Supabase Storage bucket for score proof images
-- Go to: Supabase Dashboard > Storage > New Bucket
-- Name: score-proofs
-- Public: OFF (private, accessed via signed URLs)

-- 5. Storage RLS policies (add in Supabase Dashboard > Storage > Policies)
-- Or run these SQL statements:

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('score-proofs', 'score-proofs', false)
-- ON CONFLICT DO NOTHING;

-- CREATE POLICY "Authenticated can upload score proofs"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'score-proofs');

-- CREATE POLICY "Authenticated can read score proofs"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'score-proofs');
