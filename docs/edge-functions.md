# Deploying Supabase Edge Functions

This guide explains how to deploy the Edge Functions for My Pickleball App.

## Prerequisites

1. Install Supabase CLI:
   ```powershell
   npm install -g supabase
   ```

2. Link your project (if not already linked):
   ```powershell
   supabase link --project-ref fkvoktpgrkgwedvgnibt
   ```

## Edge Functions

We have five Edge Functions:

### 1. `process-match-approval`
**Purpose**: Handles match approval/rejection workflow, awards XP, updates levels, triggers achievement checks, and calls update-ratings for ranked matches.

**Called when**: A player approves or rejects a match.

**What it does**:
- Checks if match has reached approval quorum (2/2 for singles, 3/4 for doubles)
- Awards XP to participants (120 for win, 70 for loss, +20 for ranked)
- Updates player levels based on XP formula: XP(N) = 100 * N^1.6
- Updates match status to 'approved' or 'rejected'
- **Automatically calls update-ratings for ranked matches**
- Calls check-achievements for all participants

### 2. `update-ratings`
**Purpose**: Calculates and applies Elo rating updates for approved ranked matches with anti-abuse protections.

**Called when**: A ranked match is approved (called automatically by process-match-approval).

**Auth model**:
- Accepts authenticated user JWT calls
- Accepts trusted internal service-role calls from other edge functions

**What it does**:
- Calculates team ratings (average for doubles)
- Applies Elo algorithm with K-factor bands:
  - 0-10 games: K = 40
  - 11-30 games: K = 28
  - 31+ games: K = 20
- **Applies repeat-opponent dampening**: 50% rating change for matches vs same opponent within 7 days
- **Applies daily rating gain cap**: Maximum +80 rating per day (losses not capped)
- Updates player ratings
- Increments games_played, wins, and losses
- **Records rating history for anti-abuse tracking**

### 3. `check-achievements`
**Purpose**: Checks if a player has unlocked any new achievements.

**Called when**: Automatically after match approval.

**Auth model**:
- Accepts authenticated user JWT calls
- Accepts trusted internal service-role calls from other edge functions

**What it does**:
- Checks player stats (games_played, wins, level) against achievement requirements
- Unlocks achievements if requirements are met
- Creates notifications for newly unlocked achievements
- **Automatically calls send-push-notifications to alert users**

### 4. `claim-achievement-reward`
**Purpose**: Allows a player to claim the XP reward for an unlocked achievement based on its tier.

**Called when**: A player taps "Claim Reward" on an unlocked achievement in the mobile app.

**Auth model**:
- Manual JWT validation via `getUser()` — all DB operations use service-role client

**What it does**:
- Validates the achievement belongs to the requesting user
- Checks the achievement hasn't already been claimed (idempotency guard)
- Looks up the achievement tier and maps to XP reward:
  - Bronze: 50 XP
  - Silver: 100 XP
  - Gold: 200 XP
  - Platinum: 500 XP
- Marks the achievement as claimed (`claimed_at = now()`)
- Returns the achievement name, tier, and XP reward amount

### 5. `send-push-notifications`
**Purpose**: Sends push notifications to users via Expo Push Notification service.

**Called when**: Automatically by check-achievements or other functions that create notifications.

**What it does**:
- Fetches notification details from database
- Retrieves user push tokens
- Sends notifications through Expo's push service
- Handles multiple device tokens per user

## Deployment

### Deploy all functions:
```powershell
npx supabase functions deploy process-match-approval
npx supabase functions deploy update-ratings
npx supabase functions deploy check-achievements
npx supabase functions deploy claim-achievement-reward
npx supabase functions deploy send-push-notifications
```

### Deploy a single function:
```powershell
supabase functions deploy process-match-approval
```

## Function Auth Configuration

For this project, edge functions perform explicit auth checks in code.

- `process-match-approval`: `verify_jwt = false`
- `update-ratings`: `verify_jwt = false`
- `check-achievements`: `verify_jwt = false`
- `claim-achievement-reward`: `verify_jwt = false`
- `send-push-notifications`: `verify_jwt = false`

All functions perform explicit auth checks in code, allowing robust internal service-to-service calls while still enforcing authorization.

After changing any `config.toml` auth setting, redeploy that function.

## Testing

### Test locally with Supabase CLI:
```powershell
# Start local functions server
supabase functions serve

# In another terminal, invoke a function
supabase functions invoke process-match-approval --data '{"matchId":"<match-id>"}'
```

### Test in production:
Use the mobile app - approve a match and check that:
1. XP is awarded correctly
2. Levels update when crossing thresholds
3. Ratings update for ranked matches
4. Achievements unlock when requirements are met
5. Notifications are created

## Required Database Functions

Make sure the consolidated migration has been applied:

- `20260308000001_initial_schema.sql` - Creates all tables, functions (including `increment_wins()`, `increment_losses()`), triggers, RLS policies, storage bucket, and achievement seed data

## Environment Variables

The Edge Functions use these environment variables (automatically set by Supabase):

- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has RLS bypass)

## Monitoring

Check Edge Function logs in Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/fkvoktpgrkgwedvgnibt
2. Navigate to Edge Functions
3. Click on a function to view logs and metrics

## Troubleshooting

If Edge Functions aren't being called:
1. Check that migrations are applied (especially migration 9 for helper functions)
2. Verify function deployment succeeded
3. Check function logs in Supabase Dashboard
4. Ensure mobile app is calling functions correctly (check network tab in dev tools)
5. Verify RLS policies allow the operations

## Cost Considerations

Edge Functions on Supabase:
- Free tier: 500,000 invocations/month
- Each match approval triggers 2-3 function calls (process-match-approval, optionally update-ratings, check-achievements per player)
- Monitor usage in Supabase Dashboard under Settings > Usage
