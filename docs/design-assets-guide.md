# Design Assets Replacement Guide

This project is wired to custom local PNG assets so you can swap designs by replacing files only.

## App Branding

Configured in [apps/mobile/app.json](../apps/mobile/app.json):

- App icon: `apps/mobile/assets/branding/app-icon.png`
- Splash image: `apps/mobile/assets/branding/splash.png`
- Android adaptive foreground: `apps/mobile/assets/branding/adaptive-foreground.png`
- Notification icon: `apps/mobile/assets/branding/notification-icon.png`

## Emoji Replacements (Implemented)

### Welcome screen
- Hero image: `apps/mobile/assets/illustrations/welcome-hero.png`
- Track matches icon: `apps/mobile/assets/icons/welcome-track.png`
- Level up icon: `apps/mobile/assets/icons/welcome-level-up.png`
- Leaderboard icon: `apps/mobile/assets/icons/welcome-leaderboard.png`

### Onboarding
- Track matches: `apps/mobile/assets/illustrations/onboarding-track-matches.png`
- Gain XP: `apps/mobile/assets/illustrations/onboarding-gain-xp.png`
- Climb leaderboard: `apps/mobile/assets/illustrations/onboarding-climb-leaderboard.png`
- Unlock achievements: `apps/mobile/assets/illustrations/onboarding-unlock-achievements.png`

### Achievements summary
- Summary icon: emoji `🏆`

### Register success notice
- Mail icon: emoji `📧`

## Not Changed (By Request)

- Navbar icons remain unchanged.
- Achievement card icons from database remain unchanged for now.

## Recommended PNG Specs

- App icon: 1024x1024
- Adaptive foreground: 1024x1024 with centered safe area
- Splash artwork: high-res portrait-safe composition
- In-app hero/illustrations: 1024x1024
- In-app small icons: 512x512
- Notification icon: monochrome white glyph on transparent background

## After Replacing Files

1. Restart Metro with cache clear:
   - `cd apps/mobile`
   - `npx expo start -c`
2. Rebuild native app when testing icon/splash/notification icon updates.
