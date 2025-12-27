-- Migration: Nullify due_date for CARD payments where provider did not return dueDate
-- Safe steps (please review before running in production):
-- 1) Create a backup table of affected rows
-- 2) Verify counts
-- 3) Update affected rows setting due_date = NULL
-- 4) Commit

BEGIN;

-- 1) Backup affected rows into a backup table (timestamped)
CREATE TABLE IF NOT EXISTS public.payments_due_date_backup_2025_12_27 AS
SELECT * FROM public.payments
WHERE billing_type::text ILIKE '%CARD%'
  AND (metadata->>'dueDate') IS NULL
  AND due_date IS NOT NULL;

-- 2) Quick verification counts (run and inspect before proceeding)
-- SELECT (SELECT COUNT(*) FROM public.payments_due_date_backup_2025_12_27) AS backup_count,
--        (SELECT COUNT(*) FROM public.payments WHERE billing_type::text ILIKE '%CARD%' AND (metadata->>'dueDate') IS NULL AND due_date IS NOT NULL) AS live_count;

-- 3) Perform the update (only if verification is OK)
UPDATE public.payments p
SET due_date = NULL
FROM public.payments_due_date_backup_2025_12_27 b
WHERE p.id = b.id;

-- 4) Optional: verify updates
-- SELECT COUNT(*) FROM public.payments WHERE billing_type::text ILIKE '%CARD%' AND (metadata->>'dueDate') IS NULL AND due_date IS NULL;

COMMIT;

-- DOWN (rollback): restore due_date from backup, then drop the backup table
-- NOTE: run only if you validated the backup table has correct prior values
-- BEGIN;
-- UPDATE public.payments p
-- SET due_date = b.due_date
-- FROM public.payments_due_date_backup_2025_12_27 b
-- WHERE p.id = b.id;
-- DROP TABLE IF EXISTS public.payments_due_date_backup_2025_12_27;
-- COMMIT;
