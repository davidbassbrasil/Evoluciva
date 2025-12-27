### 2025-12-27: Nullify `due_date` for CARD payments without provider `dueDate`

Context
- After allowing NULL in `payments.due_date`, we reviewed existing rows. Some CARD payments have a non-null `due_date` while their `metadata` does not carry a provider `dueDate` (i.e., the provider did not return it).

Goal
- Update only those CARD payments (created already) where `metadata->>'dueDate' IS NULL` and `due_date IS NOT NULL` to set `due_date = NULL` to reflect the provider-controlled schedule and avoid misleading dates.

Safety plan
1. Create a backup table: `public.payments_due_date_backup_2025_12_27` containing all affected rows.
2. Verify counts and sample rows in backup before applying the update.
3. Update `payments` setting `due_date = NULL` only for IDs present in backup table.
4. Provide rollback SQL that restores `due_date` from the backup table if needed.

Runbook (manual steps)
- In a maintenance window or after approval:
  1) Run the migration file `supabase/migrations/2025-12-27-nullify-card-payments-due_date.sql` on production (it executes the backup + update in a transaction).
  2) Inspect SELECT verification lines (they are commented in the migration) before committing.
  3) After running, confirm with:
     - `SELECT COUNT(*) FROM public.payments_due_date_backup_2025_12_27;`
     - `SELECT COUNT(*) FROM public.payments WHERE billing_type::text ILIKE '%CARD%' AND (metadata->>'dueDate') IS NULL AND due_date IS NULL;`

Rollback
- To rollback, run the DOWN section in the migration (it restores `due_date` values from the backup table and drops the backup table).

Notes
- The migration is conservative: it only touches CARD payments which lack provider `dueDate` in `metadata` and currently have a non-null `due_date`.
- Keep the backup table until you are fully confident; you can move it to an archive schema or export it.
