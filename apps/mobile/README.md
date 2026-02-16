# My Pickleball App - Mobile App

React Native mobile app built with Expo and Expo Router.

## Tech Stack

- **Expo SDK 54** - React Native framework
- **Expo Router 6** - File-based navigation
- **TypeScript** - Type safety
- **Supabase** - Backend (auth, database, real-time)
- **AsyncStorage** - Local session storage

## Project Structure

```
apps/mobile/
├── app/                      # Expo Router file-based routing
│   ├── (auth)/              # Auth flow (grouped route)
│   │   ├── welcome.tsx      # Landing/welcome screen
│   │   ├── login.tsx        # Sign in screen
│   │   └── register.tsx     # Sign up screen
│   ├── (tabs)/              # Main app tabs (grouped route)
│   │   ├── home.tsx         # KPI dashboard
│   │   ├── add-match.tsx    # Match submission form
│   │   ├── search.tsx       # Player search + friends
│   │   ├── leaderboard.tsx  # Rankings (global/friends)
│   │   └── settings.tsx     # Account settings
│   ├── _layout.tsx          # Root layout (AuthProvider + AuthGate)
│   └── index.tsx            # Redirect to auth or tabs
├── src/
│   ├── components/          # Reusable UI components
│   │   └── AuthGate.tsx     # Auth-aware route protection
│   ├── lib/                 # Third-party clients
│   │   └── supabase.ts      # Supabase client setup
│   ├── state/               # Global state management
│   │   └── auth.tsx         # Auth context + session provider
│   └── theme/               # Design tokens
│       ├── index.ts         # Exports
│       └── tokens.ts        # Colors, spacing, radii, typography
├── .env.example             # Environment variable template
├── app.json                 # Expo app configuration
├── babel.config.js          # Babel config (Reanimated plugin)
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Start the dev server:**
   ```bash
   npm run start
   ```

4. **Run on device/emulator:**
   - Expo Go (easiest): Scan QR code with Expo Go app
   - Android: `npm run android` (requires Android SDK)
   - iOS: `npm run ios` (requires macOS + Xcode)

## Design System

### Colors
- **Primary:** Blue (`#2b6cb0`)
- **Secondary:** Coral (`#ff6b5a`)
- **Text:** Ink (`#0b1a2b`), Muted (`#5a6a7d`)
- **Surface:** White (`#ffffff`)
- **Background:** Light gray (`#f7f8fb`)

### Spacing
- `xs: 8`, `sm: 12`, `md: 16`, `lg: 20`, `xl: 24`, `xxl: 32`

### Border Radii
- `sm: 12`, `md: 14`, `lg: 16`, `xl: 20`, `pill: 999`

### Typography
- Import from `src/theme` and use `typography.sizes.xl`, `typography.weights.bold`

## Navigation Flow

1. **Unauthenticated:** `(auth)/welcome` → `(auth)/login` or `(auth)/register`
2. **Authenticated:** `(tabs)/home` (with bottom tabs)
3. **AuthGate** handles automatic redirects based on session state

## State Management

- **Auth:** React Context (`src/state/auth.tsx`)
- **Session:** Supabase + AsyncStorage (auto-persisted)
- **Future:** Add React Query for server state caching

## Next Steps

- Wire Supabase database calls for matches, friends, rankings
- Add match approval workflow
- Implement achievements/notifications
- Build Settings screen with profile editing + sign out
- Add error boundaries and loading states

## Troubleshooting

**Metro bundler errors:**
- Clear cache: `npm run start -c`

**Peer dependency warnings:**
- Use `--legacy-peer-deps` flag for npm installs

**Android SDK not found:**
- Set `ANDROID_HOME` environment variable
- Install Android Studio + SDK Platform Tools
