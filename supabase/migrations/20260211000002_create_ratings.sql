-- Ratings table (Elo-style ranking)
create table public.ratings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null default 1200,
  games_played integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- RLS policies for ratings
alter table public.ratings enable row level security;

create policy "Ratings are viewable by everyone"
  on public.ratings for select
  using (true);

create policy "Only admins can modify ratings"
  on public.ratings for all
  using (false);

-- Create index for leaderboard queries
create index ratings_rating_idx on public.ratings(rating desc);

-- Apply updated_at trigger
create trigger ratings_updated_at
  before update on public.ratings
  for each row execute procedure public.handle_updated_at();

-- Function to create rating on profile creation
create or replace function public.handle_new_profile_rating()
returns trigger as $$
begin
  insert into public.ratings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create rating
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile_rating();
