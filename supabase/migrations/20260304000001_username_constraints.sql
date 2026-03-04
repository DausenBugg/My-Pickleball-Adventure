-- ===========================================================
-- Username constraints: uniqueness, length, and format
-- ===========================================================

-- 1. Add length constraint (2–20 characters)
alter table public.profiles
  add constraint profiles_full_name_length
  check (char_length(full_name) between 2 and 20);

-- 2. Add format constraint (alphanumeric + underscores only)
alter table public.profiles
  add constraint profiles_full_name_format
  check (full_name ~ '^[a-zA-Z0-9_]+$');

-- 3. Drop the existing non-unique lower(full_name) index — it will 
--    be superseded by the unique index below.
drop index if exists profiles_full_name_lower_idx;

-- 4. Case-insensitive unique index (prevents "Player1" and "player1" coexisting)
create unique index profiles_full_name_unique
  on public.profiles (lower(full_name));

-- 5. Harden the handle_new_user() trigger so a bad username never blocks signup.
--    If the name is missing, too long, or invalid, fall back to 'Player_<short-id>'.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _name text;
begin
  _name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), null);

  -- Validate format + length
  if _name is null
     or char_length(_name) < 2
     or char_length(_name) > 20
     or _name !~ '^[a-zA-Z0-9_]+$' then
    _name := 'Player_' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, _name);

  return new;
end;
$$ language plpgsql security definer;
