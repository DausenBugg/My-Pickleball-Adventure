-- Allow any authenticated user to insert into matches (no submitter_id check)
drop policy if exists "Users can create matches" on public.matches;

create policy "Users can create matches"
  on public.matches for insert
  with check (auth.uid() is not null);
