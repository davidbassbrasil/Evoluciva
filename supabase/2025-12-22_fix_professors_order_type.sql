-- Migration: Fix professors.order column type to INTEGER
-- This migration will:
-- 1) If "order" column exists and is text, try to convert it to integer safely.
-- 2) If "order" does not exist, add it as INTEGER NOT NULL DEFAULT 0.
-- 3) Create index on the "order" column.

BEGIN;

-- 1) If column exists and is not integer, try to convert using safe cast
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'professors' AND column_name = 'order'
  ) THEN
    -- Check data type
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'professors' AND column_name = 'order') != 'integer' THEN

      -- Try to convert text values to integer where possible
      -- For rows with non-numeric values, set them to 0 to avoid errors
      UPDATE public.professors
      SET "order" = NULLIF(regexp_replace("order", '[^0-9]', '', 'g'), '')::integer
      WHERE "order" IS NOT NULL;

      -- Now alter column type to integer using USING clause (covers NULLs)
      EXECUTE 'ALTER TABLE public.professors ALTER COLUMN "order" TYPE INTEGER USING (NULLIF(regexp_replace("order", ''[^0-9]'', '''', ''g''), '''')::integer)';

      -- Replace NULLs with 0 to allow NOT NULL
      EXECUTE 'UPDATE public.professors SET "order" = 0 WHERE "order" IS NULL';

      -- Ensure NOT NULL with default 0
      EXECUTE 'ALTER TABLE public.professors ALTER COLUMN "order" SET NOT NULL';
      EXECUTE 'ALTER TABLE public.professors ALTER COLUMN "order" SET DEFAULT 0';
    END IF;
  ELSE
    -- Column does not exist: add it
    EXECUTE 'ALTER TABLE public.professors ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0';
  END IF;
END$$;

-- 2) Ensure index exists
CREATE INDEX IF NOT EXISTS idx_professors_order ON public.professors("order");

COMMIT;
