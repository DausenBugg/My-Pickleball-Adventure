# Data model (draft)

## Core tables
- users (auth managed by Supabase)
- profiles (user metadata and stats)
- friendships (friend requests and links)
- matches (match header, type, status)
- match_participants (players, team, result)
- match_approvals (per-user approvals)
- ratings (current rating, games played)
- xp_events (awards from matches)
- achievements (definitions)
- user_achievements (earned)
- notifications (system alerts)

## Relationships (high level)
- profiles.id -> users.id
- matches.id -> match_participants.match_id
- matches.id -> match_approvals.match_id
- profiles.id -> match_participants.user_id
- profiles.id -> match_approvals.user_id
- profiles.id -> ratings.user_id
- profiles.id -> xp_events.user_id
