-- Allow users to insert friend_request notifications for other users
drop policy if exists "Submitter can notify match participants" on public.notifications;

-- Re-create the match approval notification policy
create policy "Submitter can notify match participants"
  on public.notifications for insert
  with check (
    type = 'match_approval'
    and data ? 'match_id'
    and public.is_match_submitter((data->>'match_id')::uuid, auth.uid())
    and public.is_match_participant((data->>'match_id')::uuid, notifications.user_id)
  );

-- Allow authenticated users to send friend_request notifications
create policy "Users can send friend request notifications"
  on public.notifications for insert
  with check (
    type = 'friend_request'
    and auth.uid() is not null
    and auth.uid() != user_id
  );
