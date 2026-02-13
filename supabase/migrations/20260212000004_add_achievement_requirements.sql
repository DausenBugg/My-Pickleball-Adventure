-- Add requirement fields to achievements
alter table public.achievements
  add column if not exists requirement_type text not null default 'wins',
  add column if not exists requirement_value integer not null default 1;

-- Backfill requirement values for seeded achievements
update public.achievements
set
  requirement_type = case key
    when 'first_match' then 'games_played'
    when 'matches_100' then 'games_played'
    when 'first_win' then 'wins'
    when 'win_streak_5' then 'wins'
    when 'win_streak_10' then 'wins'
    when 'level_10' then 'level'
    when 'level_25' then 'level'
    when 'rating_1500' then 'rating'
    when 'friend_count_10' then 'friends'
    else requirement_type
  end,
  requirement_value = case key
    when 'first_match' then 1
    when 'matches_100' then 100
    when 'first_win' then 1
    when 'win_streak_5' then 5
    when 'win_streak_10' then 10
    when 'level_10' then 10
    when 'level_25' then 25
    when 'rating_1500' then 1500
    when 'friend_count_10' then 10
    else requirement_value
  end;
