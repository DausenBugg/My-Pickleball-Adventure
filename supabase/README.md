# Supabase Backend

This folder contains database migrations, Edge Functions, and configuration for the My Pickleball App backend.

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

Migrations are ordered by timestamp (22 total):

**Core Schema (20260211):**
1. `20260211000001_create_profiles.sql` - User profiles and auth trigger
2. `20260211000002_create_ratings.sql` - Elo rating system
3. `20260211000003_create_friendships.sql` - Friend requests and connections
4. `20260211000004_create_matches.sql` - Match records and participants
5. `20260211000005_create_match_approvals.sql` - Match approval workflow
6. `20260211000006_create_xp_events.sql` - XP tracking per match
7. `20260211000007_create_achievements.sql` - Achievement definitions and unlocks
8. `20260211000008_create_notifications.sql` - In-app notifications
9. `20260211000009_add_helper_functions.sql` - Helper database functions
10. `20260211000010_create_rating_history.sql` - Rating history tracking
11. `20260211000011_add_self_play_prevention.sql` - Prevent self-matches

**Extended Features (20260212):**
12. `20260212000001_create_storage_bucket.sql` - Storage for avatars
13. `20260212000002_add_push_tokens.sql` - Push notification tokens
14. `20260212000003_fix_match_participants_policy.sql` - RLS policy fix
15. `20260212000004_add_achievement_requirements.sql` - Achievement requirements
16. `20260212000005_allow_match_notifications.sql` - Match notifications
17-22. Additional RLS and notification policy refinements

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

## Edge Functions

Edge Functions are in `supabase/functions/`:

- **check-achievements/** - Achievement trigger checks
- **process-match-approval/** - Match validation and approval logic
- **send-push-notifications/** - Push notification dispatching
- **update-ratings/** - Elo rating calculations

See [docs/edge-functions.md](../docs/edge-functions.md) for deployment instructions.

## Testing

After running migrations:
1. Register a user in the mobile app
2. Check that a profile and rating record are auto-created
3. Test that you can view profiles and leaderboard data
4. Verify RLS policies work correctly
