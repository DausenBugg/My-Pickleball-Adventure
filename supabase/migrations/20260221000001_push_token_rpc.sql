-- Register/unregister push tokens via SECURITY DEFINER RPC to avoid RLS conflicts
-- when a device token needs to move between accounts.

create or replace function public.register_push_token(
  p_token text,
  p_device_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.push_tokens
  where token = p_token;

  insert into public.push_tokens (user_id, token, device_name, updated_at)
  values (auth.uid(), p_token, p_device_name, now())
  on conflict (token)
  do update set
    user_id = excluded.user_id,
    device_name = excluded.device_name,
    updated_at = now();
end;
$$;

grant execute on function public.register_push_token(text, text) to authenticated;

create or replace function public.unregister_push_token(
  p_token text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.push_tokens
  where token = p_token
    and user_id = auth.uid();
end;
$$;

grant execute on function public.unregister_push_token(text) to authenticated;
