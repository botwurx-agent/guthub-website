-- Add meal-trigger link and onset time to symptom logs

ALTER TABLE public.symptom_logs
  ADD COLUMN suspected_trigger_meal_id uuid REFERENCES public.meal_logs(id) ON DELETE SET NULL,
  ADD COLUMN onset_minutes int;

-- Index for the insights correlation queries
CREATE INDEX idx_symptom_logs_trigger_meal ON public.symptom_logs (suspected_trigger_meal_id) WHERE suspected_trigger_meal_id IS NOT NULL;
