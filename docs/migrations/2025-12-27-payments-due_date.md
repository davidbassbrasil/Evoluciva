### 2025-12-27: Allow NULL on `payments.due_date`

Problem:
- The application now defers to the payment provider for credit-card payment schedules and may create payments without a provider `dueDate`. The existing DB schema required `due_date NOT NULL`, causing insertion errors.

Solution:
1. Apply migration: `supabase/migrations/2025-12-27-allow-null-payments-due_date.sql` — this drops the NOT NULL constraint.
2. Deploy migration before deploying the application change that writes `NULL` to `due_date` for card payments.
3. Add tests (see `tests/card_dueDate.test.ts`) to ensure `dueDate` is not included in the provider request for card payments.

Rollback:
- The migration includes a *down* step that sets NULLs to the current date and restores NOT NULL; review the data impact before rolling back.

Notes:
- The index on `due_date` remains intact.
- Consider showing provider `dueDate` in UI once available and storing it in `payments.due_date` when returned by the provider.
