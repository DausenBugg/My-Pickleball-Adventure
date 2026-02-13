-- Ensure match submitters can insert matches
create policy "Users can create matches"
  on public.matches for insert
  with check (auth.uid() = submitter_id);
