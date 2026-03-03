# My Pickleball App

Gamify your pickleball progress. Every match played levels up your pickleball level. Connect with friends, climb the leaderboards, and journal your pickleball matches as you become the best.

## Project Status

**Mobile app:** ✅ Feature-complete, ready for Play Store
**Watch app:** ✅ Core features complete (Wear OS)
**Backend:** ✅ Database schema + migrations + edge functions live
**CI/CD:** ✅ GitHub Actions for TypeScript checks + EAS Build/Submit
**Docs:** ✅ Design system, ranking, leveling, deployment documented

## Stack

- **Mobile:** Expo SDK 54 + React Native + TypeScript + Expo Router
- **Watch:** Expo SDK 54 + React Native (Wear OS)
- **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions)
- **CI/CD:** GitHub Actions + EAS Build + EAS Submit
- **Ads:** Google AdMob (banner ads)
- **Updates:** expo-updates (OTA)

See [docs/stack.md](docs/stack.md) for the full tech stack.

## Project structure

```
apps/mobile/          # React Native mobile app (Android)
apps/watch/           # React Native watch app (Wear OS)
docs/                 # System design docs (ranking, leveling, data model, deployment)
supabase/             # Backend migrations and edge functions
.github/workflows/    # CI (TypeScript checks) + Deploy (EAS Build/Submit)
```

## Quick Start

### Mobile App

1. Navigate to the mobile app:
   ```bash
   cd apps/mobile
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment:
   - Create `apps/mobile/.env`
   - Add Supabase credentials (see setup instructions below)

4. Start the dev server:
   ```bash
   npm run start
   ```

5. Open in Expo Go or run `npm run android`

### Watch App (Wear OS)

1. Navigate to the watch app:
   ```bash
   cd apps/watch
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Set up environment:
   - Create `apps/watch/.env`
   - Add the same Supabase credentials used by mobile

4. Start the dev server:
   ```bash
   npm run start
   ```

5. Run Android target:
   ```bash
   npm run android
   ```

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

## Deployment

- **CI/CD Guide:** [docs/deployment-ci-cd-guide.md](docs/deployment-ci-cd-guide.md) — step-by-step GitHub Actions + Play Store setup
- **Play Store Guide:** [docs/play-store-guide.md](docs/play-store-guide.md) — store listing, declarations, and submission
- **Privacy Policy:** [docs/privacy-policy.md](docs/privacy-policy.md) — required for Play Store and AdMob

Push to `main` → GitHub Actions runs TypeScript checks → builds both apps via EAS → submits to Play Store internal track.

For JS-only hotfixes: `eas update --channel production --message "description"`

## Docs

### Core Documentation
- [Stack & Architecture](docs/stack.md)
- [Data Model](docs/data-model.md)
- [Ranking System (Elo)](docs/ranking.md)
- [Leveling System (XP)](docs/leveling.md)
- [Roadmap](docs/roadmap.md)

### Deployment & Operations
- [Deployment & CI/CD Guide](docs/deployment-ci-cd-guide.md)
- [Play Store Guide](docs/play-store-guide.md)
- [Privacy Policy](docs/privacy-policy.md)
- [Edge Functions Deployment](docs/edge-functions.md)
- [Push Notifications Setup](docs/push-notifications.md)

### Implementation Guides
- [New Features Summary](docs/new-features.md)
- [Edge Case Testing](docs/edge-case-testing.md)
- [Design Assets Guide](docs/design-assets-guide.md)

## Features Implemented

### Mobile App
- ✅ Welcome, login, and registration screens
- ✅ Email verification flow
- ✅ Onboarding carousel
- ✅ Session-aware navigation (AuthGate)
- ✅ Home KPI dashboard (wins, losses, level, XP, ranking)
- ✅ Add Match form (singles/doubles, score validation, ranked/casual)
- ✅ Player search with recent players
- ✅ Match approval workflow
- ✅ Match history with filtering (all/wins/losses, date range)
- ✅ Leaderboard (global/friends toggle)
- ✅ Achievements with progress tracking
- ✅ Push notifications (match approvals, friend requests, achievements)
- ✅ Settings (profile, notifications, sign out)
- ✅ AdMob banner ads
- ✅ OTA updates via expo-updates

### Watch App (Wear OS)
- ✅ Login authentication
- ✅ Match logging (singles/doubles, ranked/casual)
- ✅ Player search with recent players
- ✅ Match approvals
- ✅ Settings with sign out
- ✅ Dark mode optimized UI

### Backend (Supabase)
- ✅ Database schema (27 migrations)
- ✅ Row Level Security policies
- ✅ Auto-profile creation on signup
- ✅ Auto-rating creation on profile creation
- ✅ Achievement seeds (9 achievements)
- ✅ Edge Functions (match approval, rating updates, achievements, push notifications)
- ✅ Security hardening (rate limiting, anti-abuse)

## Contributing

See individual README files in `apps/mobile/` and `supabase/` for detailed setup and contribution guidelines.
