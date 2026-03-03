# Tech stack

## Mobile
- Expo SDK 54 (React Native 0.81) for Android.
- TypeScript for type safety.
- Expo Router for file-based navigation.
- Supabase JS for server state and real-time subscriptions.

## Watch (Wear OS)
- Expo SDK 54 (React Native 0.81) for Wear OS.
- Shared Supabase backend with the mobile app.
- Simplified UI optimized for small round screens.

## Backend
- Supabase Postgres for data.
- Supabase Auth for login/registration.
- Row Level Security (RLS) to protect data.
- Edge Functions (Deno) for match validation, approvals, and rating updates.

## Monetization
- Google AdMob banner ads via react-native-google-mobile-ads.

## CI / CD
- GitHub Actions for automated TypeScript checks and EAS Build/Submit.
- Expo EAS Build for cloud-based Android builds.
- Expo EAS Submit for automated Play Store uploads.
- expo-updates for over-the-air JS updates.

## Why this stack
- Fast to ship with strong security defaults.
- One data source and strong mobile support.
- Scales from MVP to production.

## Hosting
- Supabase hosted project.
- App builds via Expo EAS.
