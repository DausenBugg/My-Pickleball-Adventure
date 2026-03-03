# process-match-approval Testing Guide

Use this guide to validate `process-match-approval` directly in Supabase after the JWT fix.

## 1) Get test data

### A. Find a pending match with participants
```sql
select
  m.id as match_id,
  m.status,
  m.match_type,
  m.match_mode,
  mp.user_id,
  p.full_name,
  p.email
from public.matches m
join public.match_participants mp on mp.match_id = m.id
left join public.profiles p on p.id = mp.user_id
where m.status = 'pending'
order by m.created_at desc
limit 20;
```

Pick:
- one `match_id`
- one participant `user_id` (this user token should succeed)
- one non-participant `user_id` (this user token should fail with 403)

### B. Ensure approvals table is clean for that match (optional)
```sql
delete from public.match_approvals where match_id = '<MATCH_UUID>';
```

## 2) Get a valid access token for a participant

Use the mobile app sign-in flow for the participant account, then capture the access token from app logs/dev tooling.

Token must belong to the same Supabase project as `EXPO_PUBLIC_SUPABASE_URL`.

## 3) Invoke function directly (happy path)

```bash
curl -i -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/process-match-approval" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d "{\"matchId\":\"<MATCH_UUID>\"}"
```

Expected result:
- `200` with one of:
  - `{"message":"Not enough approvals yet"}`
  - `{"message":"Match rejected","status":"rejected"}`
  - `{"message":"Match approved and XP awarded","status":"approved",...}`

## 4) Supabase CLI invoke (alternative)

```bash
supabase functions invoke process-match-approval \
  --data "{\"matchId\":\"<MATCH_UUID>\"}" \
  --header "Authorization: Bearer <ACCESS_TOKEN>" \
  --header "apikey: <ANON_KEY>"
```

## 5) Negative test matrix

### Missing Authorization header
```bash
curl -i -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/process-match-approval" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d "{\"matchId\":\"<MATCH_UUID>\"}"
```
Expect: `401`.

### Wrong-project token (JWT mismatch)
Use token from a different Supabase project.
Expect: `401 Invalid JWT` (gateway-level) or function auth failure.

### Non-participant token
Use a valid token for a user not in `match_participants` for that match.
Expect: `403` with `Only match participants can process approvals`.

### Invalid match ID format
```bash
curl -i -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/process-match-approval" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "apikey: <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d "{\"matchId\":\"not-a-uuid\"}"
```
Expect: `400` with `Invalid or missing match ID`.

## 6) Verify data side-effects

### Approval row written
```sql
select *
from public.match_approvals
where match_id = '<MATCH_UUID>'
order by created_at desc;
```

### Match status transition
```sql
select id, status, finalized_at
from public.matches
where id = '<MATCH_UUID>';
```

### XP events on approval path
```sql
select user_id, match_id, amount, reason, created_at
from public.xp_events
where match_id = '<MATCH_UUID>'
order by created_at desc;
```

### Profile XP/level updates
```sql
select id, full_name, total_xp, level, wins, losses
from public.profiles
where id in (
  select user_id from public.match_participants where match_id = '<MATCH_UUID>'
);
```

## 7) Logs to inspect

In Supabase Function Logs for `process-match-approval`, check:
- `Missing/invalid Authorization header` entries
- `auth.getUser failed` details
- `tokenIssuer` in auth debug payload

If `tokenIssuer` does not start with your project auth URL (`https://<PROJECT_REF>.supabase.co/auth/v1`), the app/session is using the wrong project token.
