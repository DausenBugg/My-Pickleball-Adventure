-- Achievements table
create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  name text not null,
  description text not null,
  icon text,
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')) default 'bronze',
  created_at timestamptz not null default now()
);

-- RLS policies for achievements
alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
  on public.achievements for select
  using (true);

-- User achievements table
create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

-- RLS policies for user_achievements
alter table public.user_achievements enable row level security;

create policy "User achievements are viewable by everyone"
  on public.user_achievements for select
  using (true);

create policy "Only system can grant achievements"
  on public.user_achievements for insert
  with check (false);

-- Indexes
create index user_achievements_user_idx on public.user_achievements(user_id);
create index user_achievements_earned_at_idx on public.user_achievements(earned_at desc);

-- Seed some achievements
insert into public.achievements (key, name, description, tier) values
  ('first_match', 'First Match', 'Log your first match', 'bronze'),
  ('first_win', 'First Victory', 'Win your first match', 'bronze'),
  ('win_streak_5', '5 Win Streak', 'Win 5 matches in a row', 'silver'),
  ('win_streak_10', '10 Win Streak', 'Win 10 matches in a row', 'gold'),
  ('level_10', 'Level 10', 'Reach level 10', 'silver'),
  ('level_25', 'Level 25', 'Reach level 25', 'gold'),
  ('rating_1500', 'Rating 1500', 'Reach 1500 rating', 'gold'),
  ('friend_count_10', 'Social Butterfly', 'Add 10 friends', 'bronze'),
  ('matches_100', 'Century Club', 'Play 100 matches', 'platinum');
