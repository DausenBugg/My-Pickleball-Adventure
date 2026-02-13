-- Helper function to avoid RLS recursion on match_participants
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

-- Replace recursive policy with helper function
drop policy if exists "Participants are viewable by match participants"
  on public.match_participants;

create policy "Participants are viewable by match participants"
  on public.match_participants for select
  using (public.is_match_participant(match_id, auth.uid()));
