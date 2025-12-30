-- Migration: Add expires_at column to popups and backfill existing rows

-- 1) Add column (allow null temporarily)
ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2) Backfill existing rows: set expires_at to created_at + 7 days (or now + 7 days if created_at null)
UPDATE public.popups
SET expires_at = COALESCE(created_at, now()) + interval '7 days'
WHERE expires_at IS NULL;

-- 3) Set NOT NULL constraint
ALTER TABLE public.popups
  ALTER COLUMN expires_at SET NOT NULL;

-- 4) Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_popups_expires_at ON public.popups USING btree (expires_at);

-- Notes:
-- - The UI will require a non-empty expires_at when creating/updating popups.
-- - On the frontend we also perform a best-effort deactivation of expired popups and select the next active, non-expired popup by created_at ascending (queue behavior).
