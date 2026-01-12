-- Issue 1: Add DELETE policy for test_sessions table (GDPR compliance)
CREATE POLICY "Users can delete their own test sessions"
ON public.test_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Issue 2: Add database constraint for room_code format validation
ALTER TABLE public.race_sessions 
ADD CONSTRAINT room_code_format 
CHECK (room_code ~ '^[0-9A-Z]{6}$');