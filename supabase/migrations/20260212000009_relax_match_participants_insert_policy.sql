-- Allow any authenticated user to insert match participants
-- This relaxes the submitter-only restriction

drop policy if exists "Submitter can add participants" on public.match_participants;

create policy "Submitter can add participants"
  on public.match_participants for insert
  with check (auth.uid() is not null);
