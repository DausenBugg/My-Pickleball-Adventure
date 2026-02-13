-- Allow match submitters to notify participants about approvals
create policy "Submitter can notify match participants"
  on public.notifications for insert
  with check (
    type = 'match_approval'
    and data ? 'match_id'
    and exists (
      select 1
      from public.matches m
      where m.id = (data->>'match_id')::uuid
        and m.submitter_id = auth.uid()
    )
    and exists (
      select 1
      from public.match_participants mp
      where mp.match_id = (data->>'match_id')::uuid
        and mp.user_id = notifications.user_id
    )
  );
