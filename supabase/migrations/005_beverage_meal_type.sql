-- Add 'beverage' as a valid meal_type in meal_logs
-- Postgres requires dropping and recreating check constraints

ALTER TABLE public.meal_logs
  DROP CONSTRAINT IF EXISTS meal_logs_meal_type_check;

ALTER TABLE public.meal_logs
  ADD CONSTRAINT meal_logs_meal_type_check
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'beverage'));
