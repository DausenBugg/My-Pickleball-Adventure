-- Tighten score validation: cap at 30 instead of 99
-- No realistic pickleball game exceeds 30 points.

create or replace function public.validate_match_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Scores must be non-negative
  if new.team_a_score < 0 or new.team_b_score < 0 then
    raise exception 'Match scores cannot be negative';
  end if;
  
  -- At least one team must have won (scores can't be tied for pickleball)
  if new.team_a_score = new.team_b_score then
    raise exception 'Match cannot end in a tie';
  end if;
  
  -- Winning score should typically be 11 or 21 (with win by 2)
  -- But we allow flexibility for different game formats
  -- Just ensure winner_team matches the higher score
  if new.team_a_score > new.team_b_score and new.winner_team != 'team_a' then
    raise exception 'Winner team does not match scores';
  end if;
  
  if new.team_b_score > new.team_a_score and new.winner_team != 'team_b' then
    raise exception 'Winner team does not match scores';
  end if;
  
  -- Reasonable score limits (prevent abuse with absurd scores)
  if new.team_a_score > 30 or new.team_b_score > 30 then
    raise exception 'Scores cannot exceed 30';
  end if;
  
  return new;
end;
$$;
