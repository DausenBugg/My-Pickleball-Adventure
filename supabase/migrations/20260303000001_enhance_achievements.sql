-- ============================================================
-- Enhance Achievements: streak tracking, new achievements, XP reward support
-- ============================================================

-- 1. Add streak tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_loss_streak integer NOT NULL DEFAULT 0;

-- 2. Make xp_events.match_id nullable so achievement XP rewards can be inserted
ALTER TABLE public.xp_events
  ALTER COLUMN match_id DROP NOT NULL;

-- 3. Fix existing achievements: win_streak_5 and win_streak_10 should be win_streak type (not wins)
UPDATE public.achievements
SET requirement_type = 'win_streak',
    name = 'On Fire',
    description = 'Win 5 matches in a row'
WHERE key = 'win_streak_5';

UPDATE public.achievements
SET requirement_type = 'win_streak',
    name = 'Unstoppable',
    description = 'Win 10 matches in a row'
WHERE key = 'win_streak_10';

-- 4. Upgrade friend_count_10 tier from bronze to silver
UPDATE public.achievements
SET tier = 'silver'
WHERE key = 'friend_count_10';

-- 5. Insert all new achievements (ON CONFLICT to be safe for re-runs)

-- Games Played milestones
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('matches_10', 'Regular Player', 'Play 10 matches', 'bronze', 'games_played', 10),
  ('matches_25', 'Dedicated', 'Play 25 matches', 'silver', 'games_played', 25),
  ('matches_50', 'Half Century', 'Play 50 matches', 'silver', 'games_played', 50),
  ('matches_250', 'Veteran', 'Play 250 matches', 'gold', 'games_played', 250),
  ('matches_500', 'Pickleball Fanatic', 'Play 500 matches', 'platinum', 'games_played', 500)
ON CONFLICT (key) DO NOTHING;

-- Total Wins milestones
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('wins_10', 'Double Digits', 'Win 10 matches', 'bronze', 'wins', 10),
  ('wins_25', 'Quarter Century', 'Win 25 matches', 'silver', 'wins', 25),
  ('wins_50', 'Fifty Wins', 'Win 50 matches', 'gold', 'wins', 50),
  ('wins_100', 'Centurion', 'Win 100 matches', 'platinum', 'wins', 100)
ON CONFLICT (key) DO NOTHING;

-- Win Streak milestones (new: 3-streak)
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('win_streak_3', 'Hot Streak', 'Win 3 matches in a row', 'bronze', 'win_streak', 3)
ON CONFLICT (key) DO NOTHING;

-- Level milestones
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('level_5', 'Getting Started', 'Reach level 5', 'bronze', 'level', 5),
  ('level_50', 'Halfway There', 'Reach level 50', 'gold', 'level', 50),
  ('level_75', 'Veteran Status', 'Reach level 75', 'platinum', 'level', 75),
  ('level_100', 'Max Prestige', 'Reach level 100', 'platinum', 'level', 100)
ON CONFLICT (key) DO NOTHING;

-- Rating milestones (all above 1200 starting rating)
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('rating_1300', 'Rising Star', 'Reach 1300 rating', 'bronze', 'rating', 1300),
  ('rating_1400', 'Competitor', 'Reach 1400 rating', 'silver', 'rating', 1400),
  ('rating_1600', 'Sharpshooter', 'Reach 1600 rating', 'gold', 'rating', 1600),
  ('rating_1750', 'Expert', 'Reach 1750 rating', 'platinum', 'rating', 1750),
  ('rating_2000', 'Grand Master', 'Reach 2000 rating', 'platinum', 'rating', 2000)
ON CONFLICT (key) DO NOTHING;

-- Friends milestones
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('friend_1', 'First Friend', 'Add your first friend', 'bronze', 'friends', 1),
  ('friend_5', 'Making Friends', 'Add 5 friends', 'bronze', 'friends', 5),
  ('friend_25', 'Popular', 'Add 25 friends', 'gold', 'friends', 25),
  ('friend_50', 'Life of the Party', 'Add 50 friends', 'platinum', 'friends', 50)
ON CONFLICT (key) DO NOTHING;

-- Loss recovery achievements
INSERT INTO public.achievements (key, name, description, tier, requirement_type, requirement_value) VALUES
  ('bounce_back', 'Bounce Back', 'Win a match right after a loss', 'bronze', 'bounce_back', 1),
  ('resilient', 'Resilient', 'Win a match after 3 consecutive losses', 'silver', 'resilient', 3)
ON CONFLICT (key) DO NOTHING;
