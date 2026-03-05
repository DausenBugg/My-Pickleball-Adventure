-- ============================================================
-- Atomic XP increment + level recalculation RPC
-- Prevents race conditions where concurrent updates overwrite each other
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_xp_and_recalculate(
  p_user_id uuid,
  p_xp_amount integer
)
RETURNS TABLE(new_total_xp integer, new_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_xp integer;
  v_level integer := 1;
BEGIN
  -- Atomically increment total_xp and return the new value
  UPDATE public.profiles
  SET total_xp = COALESCE(total_xp, 0) + p_xp_amount
  WHERE id = p_user_id
  RETURNING profiles.total_xp INTO v_total_xp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;

  -- Recalculate level using formula: XP(N) = 100 * (N+1)^1.6
  WHILE 100 * POWER(v_level + 1, 1.6) <= v_total_xp LOOP
    v_level := v_level + 1;
  END LOOP;

  -- Update level
  UPDATE public.profiles
  SET level = v_level
  WHERE id = p_user_id;

  new_total_xp := v_total_xp;
  new_level := v_level;
  RETURN NEXT;
END;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.add_xp_and_recalculate(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_xp_and_recalculate(uuid, integer) TO authenticated;
