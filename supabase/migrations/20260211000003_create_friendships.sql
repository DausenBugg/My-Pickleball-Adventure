-- Friendships table
create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id != addressee_id)
);

-- RLS policies for friendships
alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select
  using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can create friend requests"
  on public.friendships for insert
  with check (
    auth.uid() = requester_id and
    status = 'pending'
  );

create policy "Addressees can update friend requests"
  on public.friendships for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

create policy "Users can delete their own friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Indexes for efficient lookups
create index friendships_requester_idx on public.friendships(requester_id);
create index friendships_addressee_idx on public.friendships(addressee_id);
create index friendships_status_idx on public.friendships(status);

-- Apply updated_at trigger
create trigger friendships_updated_at
  before update on public.friendships
  for each row execute procedure public.handle_updated_at();
