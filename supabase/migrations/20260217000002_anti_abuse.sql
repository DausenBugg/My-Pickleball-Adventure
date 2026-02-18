-- Anti-Abuse Migration
-- Prevents match manipulation, adds match cooldowns, and optimizes search

-- ============================================================================
-- 1. Match Cooldown - Prevent same players from submitting too many matches
-- ============================================================================

-- Function to check match cooldown (same players can only submit 3 matches per hour)
create or replace function public.check_match_cooldown(
  p_participant_ids uuid[]
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_match_count integer;
begin
  -- Count matches in the last hour where ALL these participants were involved
  -- This prevents rapid match farming between the same players
  select count(distinct m.id)
  into recent_match_count
  from matches m
  inner join match_participants mp on mp.match_id = m.id
  where m.created_at > now() - interval '1 hour'
    and m.status != 'rejected'
  group by m.id
  having array_agg(mp.user_id order by mp.user_id) @> p_participant_ids
     and array_agg(mp.user_id order by mp.user_id) <@ p_participant_ids;
  
  -- Allow max 3 matches per hour between same players
  return coalesce(recent_match_count, 0) < 3;
end;
$$;

-- Alternative simpler function - count matches submitted by user in last hour
create or replace function public.check_user_match_submission_rate(
  p_user_id uuid,
  p_max_per_hour integer default 10
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*)
  into recent_count
  from matches
  where submitter_id = p_user_id
    and created_at > now() - interval '1 hour';
    
  return recent_count < p_max_per_hour;
end;
$$;

-- ============================================================================
-- 2. Match Score Validation
-- ============================================================================

-- Function to validate match scores are reasonable
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
  if new.team_a_score > 99 or new.team_b_score > 99 then
    raise exception 'Scores must be less than 100';
  end if;
  
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists validate_match_scores_trigger on public.matches;
create trigger validate_match_scores_trigger
  before insert or update on public.matches
  for each row execute function public.validate_match_scores();

-- ============================================================================
-- 3. Suspicious Pattern Detection
-- ============================================================================

-- Function to flag suspicious activity patterns
create or replace function public.check_suspicious_match_pattern(
  p_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  win_rate numeric;
  avg_margin numeric;
  recent_matches integer;
begin
  -- Get stats for recent matches (last 7 days)
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
  
  -- Flag if: 100% win rate with 10+ matches and avg margin > 8
  -- This could indicate farming with alt accounts
  if recent_matches >= 10 and win_rate = 1.0 and avg_margin > 8 then
    return true; -- Suspicious
  end if;
  
  return false; -- Not suspicious
end;
$$;

-- ============================================================================
-- 4. Search Performance Indexes
-- ============================================================================

-- Add lowercase index for case-insensitive name search with ILIKE
-- Note: ILIKE with leading wildcard still won't use this index perfectly,
-- but it helps with suffix matching and general performance
create index if not exists profiles_full_name_lower_idx 
  on public.profiles (lower(full_name));

-- Add GIN index with pg_trgm for better ILIKE performance (if extension available)
-- This requires the pg_trgm extension to be enabled
do $$
begin
  -- Try to create trigram index (will fail silently if extension not available)
  begin
    create index if not exists profiles_full_name_trgm_idx 
      on public.profiles using gin (full_name gin_trgm_ops);
  exception when undefined_object then
    -- pg_trgm extension not available, skip this index
    raise notice 'pg_trgm extension not available, skipping trigram index';
  end;
end $$;

-- Add composite index for leaderboard queries
create index if not exists ratings_rating_games_idx 
  on public.ratings (rating desc, games_played desc);

-- Add index for match history queries (user's matches by date)
create index if not exists match_participants_user_match_idx 
  on public.match_participants (user_id, match_id);

-- ============================================================================
-- 5. Device/Session Tracking (for alt account detection)
-- ============================================================================

-- Create table to track user devices/sessions
create table if not exists public.user_devices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_identifier text not null,
  device_info jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(user_id, device_identifier)
);

-- Enable RLS
alter table public.user_devices enable row level security;

-- Users can only see their own devices
create policy "Users can view their own devices"
  on public.user_devices for select
  using (auth.uid() = user_id);

-- Users can insert their own devices
create policy "Users can register their devices"
  on public.user_devices for insert
  with check (auth.uid() = user_id);

-- Users can update their own devices
create policy "Users can update their own devices"
  on public.user_devices for update
  using (auth.uid() = user_id);

-- Index for device lookups
create index if not exists user_devices_identifier_idx 
  on public.user_devices (device_identifier);

-- Function to check if device is linked to multiple accounts (potential alt detection)
create or replace function public.check_shared_device(
  p_device_identifier text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  account_count integer;
begin
  select count(distinct user_id)
  into account_count
  from user_devices
  where device_identifier = p_device_identifier;
  
  return account_count;
end;
$$;

-- ============================================================================
-- 6. Approval Cooldown
-- ============================================================================

-- Prevent users from rapidly approving/rejecting matches
create or replace function public.check_approval_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_approvals integer;
begin
  -- Count approvals in last minute
  select count(*)
  into recent_approvals
  from match_approvals
  where user_id = new.user_id
    and created_at > now() - interval '1 minute';
  
  -- Max 5 approvals per minute (prevents automation/bots)
  if recent_approvals >= 5 then
    raise exception 'Rate limit exceeded for match approvals';
  end if;
  
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists approval_rate_limit_trigger on public.match_approvals;
create trigger approval_rate_limit_trigger
  before insert on public.match_approvals
  for each row execute function public.check_approval_rate_limit();
