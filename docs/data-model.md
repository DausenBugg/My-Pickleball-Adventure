# Data model

## Status
✅ **SQL migrations created** - See `supabase/migrations/` for implementation

## Core tables
- `profiles` (user metadata and stats)
- `ratings` (current rating, games played)
- `friendships` (friend requests and links)
- `matches` (match header, type, status)
- `match_participants` (players, team, result)
- `match_approvals` (per-user approvals)
- `xp_events` (awards from matches)
- `achievements` (definitions)
- `user_achievements` (earned)
- `notifications` (system alerts)

## Relationships (high level)
- `profiles.id` -> `auth.users.id`
- `matches.id` -> `match_participants.match_id`
- `matches.id` -> `match_approvals.match_id`
- `profiles.id` -> `match_participants.user_id`
- `profiles.id` -> `match_approvals.user_id`
- `profiles.id` -> `ratings.user_id`
- `profiles.id` -> `xp_events.user_id`

## Row Level Security
All tables have RLS policies that enforce:
- Users can view their own data
- Public data is readable by all (profiles, ratings, achievements)
- Writes are restricted to authorized operations
- System operations (rating updates, XP awards) are restricted

## Running Migrations
See [supabase/README.md](../supabase/README.md) for instructions
