-- Add course_id to popups so a popup can link to a course
ALTER TABLE IF EXISTS public.popups
ADD COLUMN IF NOT EXISTS course_id UUID;

CREATE INDEX IF NOT EXISTS idx_popups_course_id ON public.popups(course_id);

-- No further operations; nullable column to avoid affecting existing rows
