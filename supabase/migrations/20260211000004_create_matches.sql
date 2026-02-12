-- Matches table
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  submitter_id uuid references public.profiles(id) on delete cascade not null,
  match_type text not null check (match_type in ('singles', 'doubles')),
  match_mode text not null check (match_mode in ('casual', 'ranked')),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  team_a_score integer not null check (team_a_score >= 0),
  team_b_score integer not null check (team_b_score >= 0),
  winner_team text check (winner_team in ('team_a', 'team_b')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz
);

-- Indexes for matches
create index matches_submitter_idx on public.matches(submitter_id);
create index matches_status_idx on public.matches(status);
create index matches_created_at_idx on public.matches(created_at desc);

-- Apply updated_at trigger
create trigger matches_updated_at
  before update on public.matches
  for each row execute procedure public.handle_updated_at();

-- Match participants table (must exist before RLS policies reference it)
create table public.match_participants (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  team text not null check (team in ('team_a', 'team_b')),
  result text check (result in ('win', 'loss')),
  created_at timestamptz not null default now(),
  unique(match_id, user_id)
);

-- Indexes for match_participants
create index match_participants_match_idx on public.match_participants(match_id);
create index match_participants_user_idx on public.match_participants(user_id);

-- NOW enable RLS and add policies for matches
alter table public.matches enable row level security;

create policy "Matches are viewable by participants"
  on public.matches for select
  using (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = id and mp.user_id = auth.uid()
    )
  );

create policy "Users can create matches"
  on public.matches for insert
  with check (auth.uid() = submitter_id);

create policy "Only system can update matches"
  on public.matches for update
  using (false);

-- RLS policies for match_participants
alter table public.match_participants enable row level security;

create policy "Participants are viewable by match participants"
  on public.match_participants for select
  using (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = match_id and mp.user_id = auth.uid()
    )
  );

create policy "Submitter can add participants"
  on public.match_participants for insert
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_id and m.submitter_id = auth.uid()
    )
  );

-- Match approvals table
create table public.match_approvals (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  approved boolean not null,
  created_at timestamptz not null default now(),
  unique(match_id, user_id)
);

-- RLS policies for match_approvals
alter table public.match_approvals enable row level security;

create policy "Approvals are viewable by match participants"
  on public.match_approvals for select
  using (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = match_id and mp.user_id = auth.uid()
    )
  );

create policy "Participants can approve matches"
  on public.match_approvals for insert
  with check (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = match_id and mp.user_id = auth.uid()
    )
  );

-- Indexes
create index match_approvals_match_idx on public.match_approvals(match_id);
create index match_approvals_user_idx on public.match_approvals(user_id);