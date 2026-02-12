# Supabase Backend

This folder contains database migrations, Edge Functions, and configuration for the My Pickleball Adventure backend.

## Setup

### 1. Install Supabase CLI (optional)

```bash
npm install -g supabase
```

### 2. Run migrations manually via Dashboard

Since you already have a Supabase project:
1. Go to your Supabase Dashboard → SQL Editor
2. Copy/paste each migration file **in order** (by timestamp)
3. Execute one by one

## Migrations

Migrations are ordered by timestamp:

1. `20260211000001_create_profiles.sql` - User profiles and auth trigger
2. `20260211000002_create_ratings.sql` - Elo rating system
3. `20260211000003_create_friendships.sql` - Friend requests and connections
4. `20260211000004_create_matches.sql` - Match records and participants
5. `20260211000005_create_match_approvals.sql` - Match approval workflow
6. `20260211000006_create_xp_events.sql` - XP tracking per match
7. `20260211000007_create_achievements.sql` - Achievement definitions and unlocks
8. `20260211000008_create_notifications.sql` - In-app notifications

## Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to view their own data
- Allow users to view public data (profiles, ratings, achievements)
- Restrict writes to authorized operations
- Use `auth.uid()` for secure user identification

## What's Included

**Tables:**
- `profiles` - User profile data (auto-created on signup)
- `ratings` - Elo ratings (auto-created with profile)
- `friendships` - Friend requests and connections
- `matches` - Match records
- `match_participants` - Players in each match
- `match_approvals` - Approval workflow for matches
- `xp_events` - XP awards from matches
- `achievements` - Achievement definitions (seeded)
- `user_achievements` - User-earned achievements
- `notifications` - In-app notifications

**Triggers:**
- Auto-create profile on user signup
- Auto-create rating on profile creation
- Auto-update `updated_at` timestamps

## Edge Functions (Coming Next)

Functions will live in `supabase/functions/` and handle:
- Match validation and approval logic
- Rating calculations (Elo updates)
- XP calculations and level-ups
- Achievement triggers
- Notification dispatching

## Testing

After running migrations:
1. Register a user in the mobile app
2. Check that a profile and rating record are auto-created
3. Test that you can view profiles and leaderboard data
4. Verify RLS policies work correctly
