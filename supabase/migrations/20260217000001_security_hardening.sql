-- Security Hardening Migration
-- Adds rate limiting, notification spam prevention, email protection, and delete policies

-- ============================================================================
-- 1. Rate Limiting for Friend Request Notifications
-- ============================================================================

-- Create table to track rate-limited actions
create table if not exists public.rate_limits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS (users cannot read rate limit data directly)
alter table public.rate_limits enable row level security;

-- Index for efficient rate checking
create index rate_limits_user_action_created_idx 
  on public.rate_limits(user_id, action_type, created_at desc);

-- Function to check rate limit (10 per hour for specified action)
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_action_type text,
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
  from rate_limits
  where user_id = p_user_id
    and action_type = p_action_type
    and created_at > now() - interval '1 hour';
    
  return recent_count < p_max_per_hour;
end;
$$;

-- Function to record rate-limited action
create or replace function public.record_rate_limit_action(
  p_user_id uuid,
  p_action_type text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into rate_limits (user_id, action_type)
  values (p_user_id, p_action_type);
  
  -- Clean up old entries (older than 2 hours)
  delete from rate_limits 
  where created_at < now() - interval '2 hours';
end;
$$;

-- ============================================================================
-- 2. Notification Spam Prevention
-- ============================================================================

-- Drop existing friend request notification policy
drop policy if exists "Users can send friend request notifications" on public.notifications;

-- Create function to check if a pending friendship exists
create or replace function public.has_pending_friendship(
  p_requester_id uuid,
  p_addressee_id uuid
) returns boolean
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

-- Stricter friend request notification policy with rate limiting
create policy "Users can send friend request notifications with rate limit"
  on public.notifications for insert
  with check (
    type = 'friend_request'
    and auth.uid() is not null
    and auth.uid() != user_id
    -- Rate limit: max 10 friend request notifications per hour
    and public.check_rate_limit(auth.uid(), 'friend_request_notification', 10)
    -- Must have a pending friendship record
    and public.has_pending_friendship(auth.uid(), user_id)
  );

-- Trigger to record rate limit action when notification is inserted
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

-- ============================================================================
-- 3. Notification Delete Policy
-- ============================================================================

-- Allow users to delete their own notifications
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 4. Profile Email Protection
-- ============================================================================

-- Create a public profiles view that excludes sensitive fields
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

-- Grant access to authenticated users
grant select on public.public_profiles to authenticated;

-- Add comment explaining the view
comment on view public.public_profiles is 
  'Public profile information without sensitive fields like email';

-- ============================================================================
-- 5. Email Verification Tracking
-- ============================================================================

-- Add email_verified column to profiles if not exists
-- (Supabase auth.users has email_confirmed_at, but we cache it in profiles for RLS)
alter table public.profiles 
  add column if not exists email_verified boolean default false;

-- Function to check if user email is verified (checks auth.users)
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

-- Function to sync email verification status from auth.users to profiles
create or replace function public.sync_email_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email_verified = (new.email_confirmed_at is not null)
  where id = new.id;
  
  return new;
end;
$$;

-- Add RLS policy to prevent unverified users from participating in matches
-- This creates a check but doesn't block existing functionality
create or replace function public.can_participate_in_match(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if email is verified in auth.users
  -- Return true if verified, false otherwise
  return exists (
    select 1 from auth.users
    where id = p_user_id
      and email_confirmed_at is not null
  );
end;
$$;

-- ============================================================================
-- 6. Duplicate Friend Request Prevention
-- ============================================================================

-- Ensure unique friendship pairs (already has unique constraint, but add reverse direction)
create or replace function public.prevent_duplicate_friendship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if reverse friendship already exists
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

-- Drop trigger if exists and recreate
drop trigger if exists prevent_duplicate_friendship_trigger on public.friendships;
create trigger prevent_duplicate_friendship_trigger
  before insert on public.friendships
  for each row execute function public.prevent_duplicate_friendship();

-- ============================================================================
-- 7. Cleanup Job - Purge old rate limit records
-- ============================================================================

-- Function to clean up old rate limit records (call periodically via cron)
create or replace function public.cleanup_rate_limits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from rate_limits
  where created_at < now() - interval '24 hours';
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
