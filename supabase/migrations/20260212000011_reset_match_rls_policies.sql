-- Reset RLS policies for matches, match_participants, and notifications

-- Matches
alter table public.matches enable row level security;

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
    where mp.match_id = p_match_id and mp.user_id = p_user_id
  );
$$;

drop policy if exists "Matches are viewable by participants" on public.matches;
create policy "Matches are viewable by participants"
  on public.matches for select
  using (public.is_match_participant(id, auth.uid()));

drop policy if exists "Users can create matches" on public.matches;
create policy "Users can create matches"
  on public.matches for insert
  with check (auth.uid() = submitter_id);

alter table public.match_participants enable row level security;

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

drop policy if exists "Submitter can add participants" on public.match_participants;
create policy "Submitter can add participants"
  on public.match_participants for insert
  with check (public.is_match_submitter(match_id, auth.uid()));

alter table public.notifications enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Submitter can notify match participants" on public.notifications;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Submitter can notify match participants"
  on public.notifications for insert
  with check (
    type = 'match_approval'
    and data ? 'match_id'
    and public.is_match_submitter((data->>'match_id')::uuid, auth.uid())
    and public.is_match_participant((data->>'match_id')::uuid, notifications.user_id)
  );
