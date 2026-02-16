# My Pickleball App

Gamify your pickleball progress. Every match played levels up your pickleball level. Connect with friends, climb the leaderboards, and journal your pickleball matches as you become the best.

## Project Status

**Mobile app:** ✅ Auth flow, navigation, and UI screens complete
**Backend:** ✅ Database schema + migrations created (ready to run)
**Docs:** ✅ Design system, ranking, and leveling rules documented

## Stack

- **Mobile:** Expo React Native + TypeScript + Expo Router
- **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions)

## Project structure

```
apps/mobile/          # React Native mobile app (iOS/Android)
docs/                 # System design docs (ranking, leveling, data model)
supabase/             # Backend migrations and functions (pending)
```

## Quick Start

### Mobile App

1. Navigate to the mobile app:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment:
   - Copy `.env.example` to `.env`
   - Add Supabase credentials (see setup instructions below)

4. Start the dev server:
   ```bash
   npm run start
   ```

5. Open in Expo Go or run `npm run android` / `npm run ios`

### Supabase Setup (Required)

The app requires a Supabase project for authentication and data:

1. Create a free Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Add to `apps/mobile/.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart Metro bundler: `npm run start -c`

## Docs

### Core Documentation
- [Stack & Architecture](docs/stack.md)
- [Data Model](docs/data-model.md)
- [Ranking System (Elo)](docs/ranking.md)
- [Leveling System (XP)](docs/leveling.md)
- [Roadmap](docs/roadmap.md)

### Implementation Guides
- [New Features Summary](docs/new-features.md)
- [Edge Functions Deployment](docs/edge-functions.md)
- [Push Notifications Setup](docs/push-notifications.md)
- [Edge Case Testing](docs/edge-case-testing.md)

## Features Implemented

### Mobile App
- ✅ Welcome, login, and registration screens
- ✅ Session-aware navigation (AuthGate)
- ✅ Home KPI dashboard
- ✅ Add Match form (singles/doubles, validation, search)
- ✅ Player search with filters
- ✅ Leaderboard (global/friends toggle)
- ✅ Settings with sign out
- ✅ Design system tokens (colors, spacing, typography)

### Backend (Supabase)
- ✅ Database schema (8 migrations)
- ✅ Row Level Security policies
- ✅ Auto-profile creation on signup
- ✅ Auto-rating creation on profile creation
- ✅ Achievement seeds (9 achievements)
- 🚧 Edge Functions (match approval, rating updates)
- 🚧 Real-time subscriptions

### PRun database migrations** (Required to use the app):
   - Open Supabase Dashboard → SQL Editor
   - Copy/paste each file from `supabase/migrations/` in order
   - Execute one by one (see [supabase/README.md](supabase/README.md))

2. **Test the app:**
   - Run `npm run start` in `apps/mobile`
   - Open in Expo Go or emulator
   - Register a new user
   - Verify profile is created in Supabase Dashboard
- 🚧 Match approval workflow (backend + UI)
- 🚧 Implement rating calculation Edge Function
- 🚧 Wire achievements system

## What You Need to Do

1. **Create a Supabase project** and add credentials to `.env`
2. **Build the database schema** in `supabase/migrations/` (see `docs/data-model.md` for guidance)
3. **Test auth flow** by registering and logging in on the mobile app

## Contributing

See individual README files in `apps/mobile/` and `supabase/` for detailed setup and contribution guidelines.
