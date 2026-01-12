-- 1. Improve handle_new_user() with explicit validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Explicit validation for defensive programming
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.email, 'user_' || NEW.id::text))
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Create function to determine race winner server-side
CREATE OR REPLACE FUNCTION public.determine_race_winner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when transitioning to completed status
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- If winner_id was already set by first finisher, determine based on progress
    IF NEW.host_progress >= 100 AND (OLD.host_progress IS NULL OR OLD.host_progress < 100) THEN
      -- Host just finished
      IF NEW.opponent_progress IS NULL OR NEW.opponent_progress < 100 THEN
        -- Host finished first
        NEW.winner_id := NEW.host_id;
      ELSE
        -- Both finished, use WPM as tiebreaker
        NEW.winner_id := CASE 
          WHEN COALESCE(NEW.host_wpm, 0) >= COALESCE(NEW.opponent_wpm, 0) 
          THEN NEW.host_id 
          ELSE NEW.opponent_id 
        END;
      END IF;
    ELSIF NEW.opponent_progress >= 100 AND (OLD.opponent_progress IS NULL OR OLD.opponent_progress < 100) THEN
      -- Opponent just finished
      IF NEW.host_progress IS NULL OR NEW.host_progress < 100 THEN
        -- Opponent finished first
        NEW.winner_id := NEW.opponent_id;
      ELSE
        -- Both finished, use WPM as tiebreaker
        NEW.winner_id := CASE 
          WHEN COALESCE(NEW.opponent_wpm, 0) > COALESCE(NEW.host_wpm, 0) 
          THEN NEW.opponent_id 
          ELSE NEW.host_id 
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic winner determination
DROP TRIGGER IF EXISTS set_race_winner ON race_sessions;
CREATE TRIGGER set_race_winner
  BEFORE UPDATE ON race_sessions
  FOR EACH ROW
  EXECUTE FUNCTION determine_race_winner();