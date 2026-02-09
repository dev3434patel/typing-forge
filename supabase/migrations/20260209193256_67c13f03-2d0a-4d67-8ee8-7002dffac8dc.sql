
-- Fix: Restrict race_sessions SELECT to participants only (not public)
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view waiting races" ON public.race_sessions;

-- Participants can view their own races (as host or opponent)
CREATE POLICY "Participants can view their races"
ON public.race_sessions
FOR SELECT
USING (auth.uid() = host_id OR auth.uid() = opponent_id);

-- Authenticated users can view waiting races to join them (limited exposure)
CREATE POLICY "Authenticated users can view waiting races"
ON public.race_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL AND status = 'waiting' AND opponent_id IS NULL);
