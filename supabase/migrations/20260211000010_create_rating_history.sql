-- Rating history table for tracking rating changes and enforcing anti-abuse rules
create table public.rating_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  old_rating integer not null,
  new_rating integer not null,
  rating_change integer not null,
  opponent_ids uuid[] not null, -- Array of opponent user IDs
  created_at timestamptz not null default now()
);

-- Indexes for rating history
create index rating_history_user_idx on public.rating_history(user_id);
create index rating_history_match_idx on public.rating_history(match_id);
create index rating_history_created_at_idx on public.rating_history(created_at desc);
create index rating_history_user_created_idx on public.rating_history(user_id, created_at desc);

-- RLS policies for rating_history
alter table public.rating_history enable row level security;

create policy "Users can view their own rating history"
  on public.rating_history for select
  using (auth.uid() = user_id);

create policy "Only system can insert rating history"
  on public.rating_history for insert
  with check (false);

-- Function to check daily rating gain
create or replace function check_daily_rating_gain(p_user_id uuid, p_new_change integer)
returns integer as $$
declare
  daily_gain integer;
  max_daily_gain integer := 80;
  allowed_change integer;
begin
  -- Calculate total rating gain today (only positive changes)
  select coalesce(sum(greatest(rating_change, 0)), 0)
  into daily_gain
  from rating_history
  where user_id = p_user_id
    and created_at >= current_date
    and created_at < current_date + interval '1 day';
  
  -- If new change is negative (rating loss), allow it fully
  if p_new_change <= 0 then
    return p_new_change;
  end if;
  
  -- Calculate allowed positive change
  allowed_change := least(p_new_change, max_daily_gain - daily_gain);
  
  -- Ensure non-negative
  return greatest(allowed_change, 0);
end;
$$ language plpgsql security definer;

-- Function to check repeat opponent dampening
create or replace function check_repeat_opponent_dampening(
  p_user_id uuid,
  p_opponent_ids uuid[],
  p_rating_change integer
)
returns integer as $$
declare
  recent_match_count integer;
begin
  -- Check if user has played any of these opponents in the last 7 days
  select count(*)
  into recent_match_count
  from rating_history
  where user_id = p_user_id
    and created_at >= now() - interval '7 days'
    and opponent_ids && p_opponent_ids; -- Array overlap operator
  
  -- If this is not the first match vs these opponents in 7 days, apply 50% dampening
  if recent_match_count > 0 then
    return p_rating_change / 2;
  end if;
  
  return p_rating_change;
end;
$$ language plpgsql security definer;
