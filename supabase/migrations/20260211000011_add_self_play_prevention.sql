-- Function to prevent self-play (same user on both teams)
create or replace function check_no_self_play()
returns trigger as $$
declare
  team_a_users uuid[];
  team_b_users uuid[];
  overlapping_users uuid[];
begin
  -- Get all user IDs on team A
  select array_agg(user_id)
  into team_a_users
  from match_participants
  where match_id = new.match_id and team = 'team_a';
  
  -- Get all user IDs on team B
  select array_agg(user_id)
  into team_b_users
  from match_participants
  where match_id = new.match_id and team = 'team_b';
  
  -- Check for overlapping users
  if team_a_users is not null and team_b_users is not null then
    select array_agg(user_id)
    into overlapping_users
    from (
      select unnest(team_a_users) as user_id
      intersect
      select unnest(team_b_users) as user_id
    ) as overlap;
    
    if overlapping_users is not null and array_length(overlapping_users, 1) > 0 then
      raise exception 'Self-play not allowed: same user cannot appear on both teams';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Add trigger to match_participants to check for self-play
create trigger check_self_play_trigger
  after insert or update on match_participants
  for each row
  execute function check_no_self_play();
