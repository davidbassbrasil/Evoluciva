-- Migration: Allow NULL on payments.due_date
-- Reason: Credit-card payments may not have a provider-provided due date. The application now stores NULL when provider does not return a due date.
-- Up: drop NOT NULL constraint
ALTER TABLE public.payments
  ALTER COLUMN due_date DROP NOT NULL;

-- Optional: keep index on due_date as-is. No other structural changes required.

-- Down (rollback): set a reasonable date for NULLs and restore NOT NULL.
-- NOTE: Down makes a destructive assumption: it fills missing dates with current date; adapt if needed.
UPDATE public.payments
  SET due_date = now()::date
  WHERE due_date IS NULL;

ALTER TABLE public.payments
  ALTER COLUMN due_date SET NOT NULL;
