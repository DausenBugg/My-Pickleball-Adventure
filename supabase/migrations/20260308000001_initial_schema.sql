-- ============================================================================
-- My Pickleball Adventure — Consolidated Initial Schema
-- Merged from 32 incremental migrations (Feb-Mar 2026)
-- Dead code removed: user_devices, check_shared_device(), sync_email_verification()
-- ============================================================================

-- ============================================================================
-- 0. Extensions
-- ============================================================================
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. Profiles
-- ============================================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  level integer not null default 1,
  total_xp integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  current_win_streak integer not null default 0,
  best_win_streak integer not null default 0,
  email_verified boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create index profiles_email_idx on public.profiles(email);

-- Username constraints
alter table public.profiles
  add constraint profiles_full_name_length
  check (char_length(full_name) between 2 and 20);

alter table public.profiles
  add constraint profiles_full_name_format
  check (full_name ~ '^[a-zA-Z0-9_]+$');

create unique index profiles_full_name_unique
  on public.profiles (lower(full_name));

-- Updated_at trigger function (shared)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on signup (hardened: bad username falls back to Player_<short-id>)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _name text;
begin
  _name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), null);

  if _name is null
     or char_length(_name) < 2
     or char_length(_name) > 20
     or _name !~ '^[a-zA-Z0-9_]+$' then
    _name := 'Player_' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, _name);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Public profiles view (excludes sensitive fields)
create or replace view public.public_profiles as
select
  id,
  full_name,
  avatar_url,
  level,
  wins,
  losses,
  total_xp,
  created_at
from public.profiles;

grant select on public.public_profiles to authenticated;
comment on view public.public_profiles is
  'Public profile information without sensitive fields like email';

-- ============================================================================
-- 2. Ratings
-- ============================================================================
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null default 1200,
  games_played integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Only admins can modify ratings"
  on public.ratings for all
  using (false);

create index ratings_rating_idx on public.ratings(rating desc);
create index ratings_rating_games_idx
  on public.ratings (rating desc, games_played desc);

create trigger ratings_updated_at
  before update on public.ratings
  for each row execute procedure public.handle_updated_at();

-- Auto-create rating row on profile creation
create or replace function public.handle_new_profile_rating()
returns trigger as $$
begin
  insert into public.ratings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile_rating();

-- ============================================================================
-- 3. Friendships
-- ============================================================================
create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id != addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "Users can create friend requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id and status = 'pending');

create policy "Addressees can update friend requests"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

create policy "Users can delete their own friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create index friendships_requester_idx on public.friendships(requester_id);
create index friendships_addressee_idx on public.friendships(addressee_id);
create index friendships_status_idx on public.friendships(status);

create trigger friendships_updated_at
  before update on public.friendships
  for each row execute procedure public.handle_updated_at();

-- Prevent duplicate reverse friendship
create or replace function public.prevent_duplicate_friendship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from friendships
    where requester_id = new.addressee_id
      and addressee_id = new.requester_id
  ) then
    raise exception 'A friendship request already exists between these users';
  end if;
  return new;
end;
$$;

create trigger prevent_duplicate_friendship_trigger
  before insert on public.friendships
  for each row execute function public.prevent_duplicate_friendship();

-- ============================================================================
-- 4. Matches & Match Participants
-- ============================================================================
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  submitter_id uuid references public.profiles(id) on delete cascade not null,
  match_type text not null check (match_type in ('singles', 'doubles')),
  match_mode text not null check (match_mode in ('casual', 'ranked')),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  team_a_score integer not null check (team_a_score >= 0),
  team_b_score integer not null check (team_b_score >= 0),
  winner_team text check (winner_team in ('team_a', 'team_b')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index matches_submitter_idx on public.matches(submitter_id);
create index matches_status_idx on public.matches(status);
create index matches_created_at_idx on public.matches(created_at desc);

create trigger matches_updated_at
  before update on public.matches
  for each row execute procedure public.handle_updated_at();

create table public.match_participants (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team text not null check (team in ('team_a', 'team_b')),
  result text check (result in ('win', 'loss')),
  created_at timestamptz not null default now(),
  unique(match_id, user_id)
);

create index match_participants_match_idx on public.match_participants(match_id);
create index match_participants_user_idx on public.match_participants(user_id);
create index match_participants_user_match_idx
  on public.match_participants (user_id, match_id);

-- Helper functions to avoid RLS recursion
create or replace function public.is_match_participant(
  p_match_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.match_participants mp
    where mp.match_id = p_match_id
      and mp.user_id = p_user_id
  );
$$;

create or replace function public.is_match_submitter(
  p_match_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id and m.submitter_id = p_user_id
  );
$$;

-- RLS for matches
alter table public.matches enable row level security;

create policy "Matches are viewable by participants"
  on public.matches for select
  using (public.is_match_participant(id, auth.uid()));

create policy "Users can create matches"
  on public.matches for insert
  with check (auth.uid() = submitter_id);

create policy "Only system can update matches"
  on public.matches for update
  using (false);

-- RLS for match_participants
alter table public.match_participants enable row level security;

create policy "Participants are viewable by match participants"
  on public.match_participants for select
  using (public.is_match_participant(match_id, auth.uid()));

create policy "Submitter can add participants"
  on public.match_participants for insert
  with check (public.is_match_submitter(match_id, auth.uid()));

-- Security definer RPC to insert matches
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
    submitter_id, match_type, match_mode,
    team_a_score, team_b_score, winner_team, status
  )
  values (
    auth.uid(), p_match_type, p_match_mode,
    p_team_a_score, p_team_b_score, p_winner_team, 'pending'
  )
  returning id into v_match_id;

  return v_match_id;
end;
$$;

-- Self-play prevention
create or replace function check_no_self_play()
returns trigger as $$
declare
  team_a_users uuid[];
  team_b_users uuid[];
  overlapping_users uuid[];
begin
  select array_agg(user_id) into team_a_users
  from match_participants
  where match_id = new.match_id and team = 'team_a';

  select array_agg(user_id) into team_b_users
  from match_participants
  where match_id = new.match_id and team = 'team_b';

  if team_a_users is not null and team_b_users is not null then
    select array_agg(user_id) into overlapping_users
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

create trigger check_self_play_trigger
  after insert or update on match_participants
  for each row
  execute function check_no_self_play();

-- Score validation (capped at 30)
create or replace function public.validate_match_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.team_a_score < 0 or new.team_b_score < 0 then
    raise exception 'Match scores cannot be negative';
  end if;

  if new.team_a_score = new.team_b_score then
    raise exception 'Match cannot end in a tie';
  end if;

  if new.team_a_score > new.team_b_score and new.winner_team != 'team_a' then
    raise exception 'Winner team does not match scores';
  end if;

  if new.team_b_score > new.team_a_score and new.winner_team != 'team_b' then
    raise exception 'Winner team does not match scores';
  end if;

  if new.team_a_score > 30 or new.team_b_score > 30 then
    raise exception 'Scores cannot exceed 30';
  end if;

  return new;
end;
$$;

create trigger validate_match_scores_trigger
  before insert or update on public.matches
  for each row execute function public.validate_match_scores();

-- ============================================================================
-- 5. Match Approvals
-- ============================================================================
create table public.match_approvals (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  approved boolean not null,
  created_at timestamptz not null default now(),
  unique(match_id, user_id)
);

alter table public.match_approvals enable row level security;

create policy "Approvals are viewable by match participants"
  on public.match_approvals for select
  using (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = match_id and mp.user_id = auth.uid()
    )
  );

create policy "Participants can submit approvals"
  on public.match_approvals for insert
  with check (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = match_id and mp.user_id = auth.uid()
    ) and auth.uid() = user_id
  );

create policy "Users can update their own approvals"
  on public.match_approvals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index match_approvals_match_idx on public.match_approvals(match_id);
create index match_approvals_user_idx on public.match_approvals(user_id);

-- Approval rate limiting
create or replace function public.check_approval_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_approvals integer;
begin
  select count(*) into recent_approvals
  from match_approvals
  where user_id = new.user_id
    and created_at > now() - interval '1 minute';

  if recent_approvals >= 5 then
    raise exception 'Rate limit exceeded for match approvals';
  end if;

  return new;
end;
$$;

create trigger approval_rate_limit_trigger
  before insert on public.match_approvals
  for each row execute function public.check_approval_rate_limit();

-- ============================================================================
-- 6. XP Events
-- ============================================================================
create table public.xp_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade,
  xp_amount integer not null check (xp_amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;

create policy "Users can view their own XP events"
  on public.xp_events for select
  using (auth.uid() = user_id);

create policy "Only system can create XP events"
  on public.xp_events for insert
  with check (false);

create index xp_events_user_idx on public.xp_events(user_id);
create index xp_events_match_idx on public.xp_events(match_id);
create index xp_events_created_at_idx on public.xp_events(created_at desc);

-- Atomic XP increment + level recalculation RPC
create or replace function public.add_xp_and_recalculate(
  p_user_id uuid,
  p_xp_amount integer
)
returns table(new_total_xp integer, new_level integer)
language plpgsql
security definer
as $$
declare
  v_total_xp integer;
  v_level integer := 1;
begin
  update public.profiles
  set total_xp = coalesce(total_xp, 0) + p_xp_amount
  where id = p_user_id
  returning profiles.total_xp into v_total_xp;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;

  -- Level formula: XP(N) = 100 * (N+1)^1.6
  while 100 * power(v_level + 1, 1.6) <= v_total_xp loop
    v_level := v_level + 1;
  end loop;

  update public.profiles
  set level = v_level
  where id = p_user_id;

  new_total_xp := v_total_xp;
  new_level := v_level;
  return next;
end;
$$;

grant execute on function public.add_xp_and_recalculate(uuid, integer) to service_role;
grant execute on function public.add_xp_and_recalculate(uuid, integer) to authenticated;

-- ============================================================================
-- 7. Achievements
-- ============================================================================
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  name text not null,
  description text not null,
  icon text,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')) default 'bronze',
  requirement_type text not null default 'wins',
  requirement_value integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
  on public.achievements for select
  using (true);

create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamptz not null default now(),
  claimed_at timestamptz,
  unique(user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "User achievements are viewable by everyone"
  on public.user_achievements for select
  using (true);

create policy "Only system can grant achievements"
  on public.user_achievements for insert
  with check (false);

create index user_achievements_user_idx on public.user_achievements(user_id);
create index user_achievements_earned_at_idx on public.user_achievements(earned_at desc);

-- Seed 32 achievements across 6 types
-- Original 9, then enhanced set
insert into public.achievements (key, name, description, tier, requirement_type, requirement_value) values
  -- Games Played
  ('first_match', 'First Match', 'Log your first match', 'bronze', 'games_played', 1),
  ('matches_10', 'Regular Player', 'Play 10 matches', 'bronze', 'games_played', 10),
  ('matches_25', 'Dedicated', 'Play 25 matches', 'silver', 'games_played', 25),
  ('matches_50', 'Half Century', 'Play 50 matches', 'silver', 'games_played', 50),
  ('matches_100', 'Century Club', 'Play 100 matches', 'platinum', 'games_played', 100),
  ('matches_250', 'Veteran', 'Play 250 matches', 'gold', 'games_played', 250),
  ('matches_500', 'Pickleball Fanatic', 'Play 500 matches', 'platinum', 'games_played', 500),
  -- Wins
  ('first_win', 'First Victory', 'Win your first match', 'bronze', 'wins', 1),
  ('wins_10', 'Double Digits', 'Win 10 matches', 'bronze', 'wins', 10),
  ('wins_25', 'Quarter Century', 'Win 25 matches', 'silver', 'wins', 25),
  ('wins_50', 'Fifty Wins', 'Win 50 matches', 'gold', 'wins', 50),
  ('wins_100', 'Centurion', 'Win 100 matches', 'platinum', 'wins', 100),
  -- Win Streak
  ('win_streak_3', 'Hot Streak', 'Win 3 matches in a row', 'bronze', 'win_streak', 3),
  ('win_streak_5', 'On Fire', 'Win 5 matches in a row', 'silver', 'win_streak', 5),
  ('win_streak_10', 'Unstoppable', 'Win 10 matches in a row', 'gold', 'win_streak', 10),
  -- Level
  ('level_5', 'Getting Started', 'Reach level 5', 'bronze', 'level', 5),
  ('level_10', 'Level 10', 'Reach level 10', 'silver', 'level', 10),
  ('level_25', 'Level 25', 'Reach level 25', 'gold', 'level', 25),
  ('level_50', 'Halfway There', 'Reach level 50', 'gold', 'level', 50),
  ('level_75', 'Veteran Status', 'Reach level 75', 'platinum', 'level', 75),
  ('level_100', 'Max Prestige', 'Reach level 100', 'platinum', 'level', 100),
  -- Rating
  ('rating_1300', 'Rising Star', 'Reach 1300 rating', 'bronze', 'rating', 1300),
  ('rating_1400', 'Competitor', 'Reach 1400 rating', 'silver', 'rating', 1400),
  ('rating_1500', 'Rating 1500', 'Reach 1500 rating', 'gold', 'rating', 1500),
  ('rating_1600', 'Sharpshooter', 'Reach 1600 rating', 'gold', 'rating', 1600),
  ('rating_1750', 'Expert', 'Reach 1750 rating', 'platinum', 'rating', 1750),
  ('rating_2000', 'Grand Master', 'Reach 2000 rating', 'platinum', 'rating', 2000),
  -- Friends
  ('friend_1', 'First Friend', 'Add your first friend', 'bronze', 'friends', 1),
  ('friend_5', 'Making Friends', 'Add 5 friends', 'bronze', 'friends', 5),
  ('friend_count_10', 'Social Butterfly', 'Add 10 friends', 'silver', 'friends', 10),
  ('friend_25', 'Popular', 'Add 25 friends', 'gold', 'friends', 25),
  ('friend_50', 'Life of the Party', 'Add 50 friends', 'platinum', 'friends', 50);

-- Achievement icons (Ionicons names)
update public.achievements set icon = 'trophy' where tier = 'bronze';
update public.achievements set icon = 'trophy-outline' where tier = 'silver';
update public.achievements set icon = 'trophy' where tier = 'gold';
update public.achievements set icon = 'trophy' where tier = 'platinum';
update public.achievements set icon = 'trophy' where icon is null;

-- ============================================================================
-- 8. Notifications
-- ============================================================================
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('match_approval', 'friend_request', 'achievement', 'system')),
  title text not null,
  message text not null,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

create policy "Submitter can notify match participants"
  on public.notifications for insert
  with check (
    type = 'match_approval'
    and data ? 'match_id'
    and public.is_match_submitter((data->>'match_id')::uuid, auth.uid())
    and public.is_match_participant((data->>'match_id')::uuid, notifications.user_id)
  );

create index notifications_user_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(read);
create index notifications_created_at_idx on public.notifications(created_at desc);

-- ============================================================================
-- 9. Helper Functions
-- ============================================================================
create or replace function increment_wins(user_id uuid)
returns void as $$
begin
  update profiles set wins = wins + 1 where id = user_id;
end;
$$ language plpgsql security definer;

create or replace function increment_losses(user_id uuid)
returns void as $$
begin
  update profiles set losses = losses + 1 where id = user_id;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 10. Rating History
-- ============================================================================
create table public.rating_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  old_rating integer not null,
  new_rating integer not null,
  rating_change integer not null,
  opponent_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create index rating_history_user_idx on public.rating_history(user_id);
create index rating_history_match_idx on public.rating_history(match_id);
create index rating_history_created_at_idx on public.rating_history(created_at desc);
create index rating_history_user_created_idx on public.rating_history(user_id, created_at desc);

alter table public.rating_history enable row level security;

create policy "Users can view their own rating history"
  on public.rating_history for select
  using (auth.uid() = user_id);

create policy "Only system can insert rating history"
  on public.rating_history for insert
  with check (false);

-- Daily rating gain cap
create or replace function check_daily_rating_gain(p_user_id uuid, p_new_change integer)
returns integer as $$
declare
  daily_gain integer;
  max_daily_gain integer := 80;
  allowed_change integer;
begin
  select coalesce(sum(greatest(rating_change, 0)), 0)
  into daily_gain
  from rating_history
  where user_id = p_user_id
    and created_at >= current_date
    and created_at < current_date + interval '1 day';

  if p_new_change <= 0 then
    return p_new_change;
  end if;

  allowed_change := least(p_new_change, max_daily_gain - daily_gain);
  return greatest(allowed_change, 0);
end;
$$ language plpgsql security definer;

-- Repeat opponent dampening
create or replace function check_repeat_opponent_dampening(
  p_user_id uuid,
  p_opponent_ids uuid[],
  p_rating_change integer
)
returns integer as $$
declare
  recent_match_count integer;
begin
  select count(*) into recent_match_count
  from rating_history
  where user_id = p_user_id
    and created_at >= now() - interval '7 days'
    and opponent_ids && p_opponent_ids;

  if recent_match_count > 0 then
    return p_rating_change / 2;
  end if;

  return p_rating_change;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- 11. Storage Bucket (avatars)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ============================================================================
-- 12. Push Tokens
-- ============================================================================
create table public.push_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text not null unique,
  device_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

create policy "Users can view their own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own push tokens"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

create index push_tokens_user_id_idx on public.push_tokens(user_id);

-- Push token RPCs (security definer to allow cross-account token moves)
create or replace function public.register_push_token(
  p_token text,
  p_device_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.push_tokens where token = p_token;

  insert into public.push_tokens (user_id, token, device_name, updated_at)
  values (auth.uid(), p_token, p_device_name, now())
  on conflict (token)
  do update set
    user_id = excluded.user_id,
    device_name = excluded.device_name,
    updated_at = now();
end;
$$;

grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.unregister_push_token(
  p_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.push_tokens
  where token = p_token and user_id = auth.uid();
end;
$$;

grant execute on function public.unregister_push_token(text) to authenticated;

create or replace function public.unregister_all_push_tokens()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.push_tokens where user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.unregister_all_push_tokens() to authenticated;

-- ============================================================================
-- 13. Rate Limits (for notification spam prevention)
-- ============================================================================
create table public.rate_limits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null,
  created_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

create index rate_limits_user_action_created_idx
  on public.rate_limits(user_id, action_type, created_at desc);

create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_per_hour integer default 10
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from rate_limits
  where user_id = p_user_id
    and action_type = p_action_type
    and created_at > now() - interval '1 hour';
  return recent_count < p_max_per_hour;
end;
$$;

create or replace function public.record_rate_limit_action(
  p_user_id uuid,
  p_action_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into rate_limits (user_id, action_type)
  values (p_user_id, p_action_type);

  delete from rate_limits where created_at < now() - interval '2 hours';
end;
$$;

create or replace function public.has_pending_friendship(
  p_requester_id uuid,
  p_addressee_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from friendships
    where requester_id = p_requester_id
      and addressee_id = p_addressee_id
      and status = 'pending'
  );
end;
$$;

-- Friend request notification with rate limit
create policy "Users can send friend request notifications with rate limit"
  on public.notifications for insert
  with check (
    type = 'friend_request'
    and auth.uid() is not null
    and auth.uid() != user_id
    and public.check_rate_limit(auth.uid(), 'friend_request_notification', 10)
    and public.has_pending_friendship(auth.uid(), user_id)
  );

-- Record rate limit on notification insert
create or replace function public.record_notification_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'friend_request' then
    perform public.record_rate_limit_action(auth.uid(), 'friend_request_notification');
  end if;
  return new;
end;
$$;

create trigger notifications_rate_limit_trigger
  after insert on public.notifications
  for each row execute function public.record_notification_rate_limit();

create or replace function public.cleanup_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from rate_limits where created_at < now() - interval '24 hours';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ============================================================================
-- 14. Anti-Abuse (match cooldowns, suspicious patterns, search indexes)
-- ============================================================================

-- Match cooldown (same players: max 3 matches/hour)
create or replace function public.check_match_cooldown(
  p_participant_ids uuid[]
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_match_count integer;
begin
  select count(distinct m.id) into recent_match_count
  from matches m
  inner join match_participants mp on mp.match_id = m.id
  where m.created_at > now() - interval '1 hour'
    and m.status != 'rejected'
  group by m.id
  having array_agg(mp.user_id order by mp.user_id) @> p_participant_ids
     and array_agg(mp.user_id order by mp.user_id) <@ p_participant_ids;

  return coalesce(recent_match_count, 0) < 3;
end;
$$;

-- User submission rate limit (max 10 matches/hour)
create or replace function public.check_user_match_submission_rate(
  p_user_id uuid,
  p_max_per_hour integer default 10
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from matches
  where submitter_id = p_user_id
    and created_at > now() - interval '1 hour';
  return recent_count < p_max_per_hour;
end;
$$;

-- Suspicious pattern detection
create or replace function public.check_suspicious_match_pattern(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  win_rate numeric;
  avg_margin numeric;
  recent_matches integer;
begin
  select
    count(*),
    avg(case when mp.team = m.winner_team then 1 else 0 end),
    avg(abs(m.team_a_score - m.team_b_score))
  into recent_matches, win_rate, avg_margin
  from matches m
  inner join match_participants mp on mp.match_id = m.id
  where mp.user_id = p_user_id
    and m.status = 'approved'
    and m.created_at > now() - interval '7 days';

  if recent_matches >= 10 and win_rate = 1.0 and avg_margin > 8 then
    return true;
  end if;

  return false;
end;
$$;

-- Search performance indexes
do $$
begin
  begin
    create index if not exists profiles_full_name_trgm_idx
      on public.profiles using gin (full_name gin_trgm_ops);
  exception when undefined_object then
    raise notice 'pg_trgm extension not available, skipping trigram index';
  end;
end $$;

-- Email verification check
create or replace function public.is_email_verified(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  confirmed_at timestamptz;
begin
  select email_confirmed_at into confirmed_at
  from auth.users
  where id = p_user_id;
  return confirmed_at is not null;
end;
$$;

create or replace function public.can_participate_in_match(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from auth.users
    where id = p_user_id
      and email_confirmed_at is not null
  );
end;
$$;
