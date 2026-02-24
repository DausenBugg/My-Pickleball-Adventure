-- Remove all push tokens for the authenticated user via SECURITY DEFINER RPC.
-- This lets clients revoke notifications across devices without direct table deletes.

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

  delete from public.push_tokens
  where user_id = auth.uid();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.unregister_all_push_tokens() to authenticated;
