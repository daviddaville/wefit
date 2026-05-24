-- Add separate first/last name columns (full_name kept for backward compat)
ALTER TABLE public.users
  ADD COLUMN first_name text,
  ADD COLUMN last_name  text;

-- Backfill: first word → first_name, remainder → last_name
UPDATE public.users
SET
  first_name = split_part(full_name, ' ', 1),
  last_name  = nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 2)), '');
