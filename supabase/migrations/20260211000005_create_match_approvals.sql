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

create policy "Participants can submit approvals"
  on public.match_approvals for insert
  with check (
    exists (
      select 1 from public.match_participants mp
      where mp.match_id = match_id and mp.user_id = auth.uid()
    ) and
    auth.uid() = user_id
  );

create policy "Users can update their own approvals"
  on public.match_approvals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes
create index match_approvals_match_idx on public.match_approvals(match_id);
create index match_approvals_user_idx on public.match_approvals(user_id);
