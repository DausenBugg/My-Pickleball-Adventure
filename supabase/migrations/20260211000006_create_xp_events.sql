-- XP events table (tracks XP awards from matches)
create table public.xp_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  xp_amount integer not null check (xp_amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

-- RLS policies for xp_events
alter table public.xp_events enable row level security;

create policy "Users can view their own XP events"
  on public.xp_events for select
  using (auth.uid() = user_id);

create policy "Only system can create XP events"
  on public.xp_events for insert
  with check (false);

-- Indexes
create index xp_events_user_idx on public.xp_events(user_id);
create index xp_events_match_idx on public.xp_events(match_id);
create index xp_events_created_at_idx on public.xp_events(created_at desc);
