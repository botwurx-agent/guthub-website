-- Add flags array to bm_logs (Urgency, Blood/mucus, Incomplete feeling, Painful)
-- per spec Section 2 bowel movement log definition
ALTER TABLE public.bm_logs ADD COLUMN IF NOT EXISTS flags text[] DEFAULT '{}';
