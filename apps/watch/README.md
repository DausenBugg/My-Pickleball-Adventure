# Watch App (Wear OS v1)

Standalone smartwatch client focused on fast match logging and pending match approvals.

## Scope (v1)

- Sign in with existing account
- Log singles/doubles matches
- Search participants by name/email
- Approve or decline pending matches
- Online-only behavior

## Platform

- Android watches (Wear OS)
- iOS/watchOS is out of scope for this app version

## Setup

1. Create `apps/watch/.env` with:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. Install dependencies:

```bash
cd apps/watch
npm install
```

3. Start dev server:

```bash
npm run start
```

4. Run Android target:

```bash
npm run android
```

## Backend contracts reused

- `insert_match` RPC for match creation
- `match_participants` table insert
- `match_approvals` upsert for votes
- `process-match-approval` Edge Function invocation

## Notes

- This app intentionally keeps the UI compact and action-oriented for smartwatch constraints.
- If watch connectivity fails, actions fail fast and require retry (no offline queue in v1).