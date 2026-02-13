-- Security definer function to insert matches with auth.uid()
create or replace function public.insert_match(
  p_match_type text,
  p_match_mode text,
  p_team_a_score integer,
  p_team_b_score integer,
  p_winner_team text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.matches (
    submitter_id,
    match_type,
    match_mode,
    team_a_score,
    team_b_score,
    winner_team,
    status
  )
  values (
    auth.uid(),
    p_match_type,
    p_match_mode,
    p_team_a_score,
    p_team_b_score,
    p_winner_team,
    'pending'
  )
  returning id into v_match_id;

  return v_match_id;
end;
$$;
