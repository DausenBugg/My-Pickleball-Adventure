# Google Play Store Deployment Guide

Step-by-step instructions to publish **My Pickleball App** on the Google Play Store.

---

## Prerequisites

- [x] EAS CLI installed globally (`npm install -g eas-cli`)
- [x] Expo account (create at https://expo.dev/signup)
- [x] Google Play Developer account ($25 one-time fee — https://play.google.com/console)
- [x] Firebase project with FCM configured (see [Firebase Setup](#1-firebase--fcm-setup) below)

---

## 1. Firebase / FCM Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2. Click **Add app** → **Android**.
3. Enter the package name: `com.dbugg.mypickleballadventure`.
4. Download the generated `google-services.json`.
5. Place it at `apps/mobile/google-services.json` (the `app.json` `googleServicesFile` field points here).
6. In Firebase Console → Project Settings → **Cloud Messaging** tab, ensure FCM v1 API is enabled.

> **Note:** `google-services.json` is tracked in git (it's client-side Firebase config with API keys restricted by Android app-signing SHA-1, safe to commit). No need to base64-encode it for CI.

---

## 2. Configure EAS Project

```bash
cd apps/mobile

# Log in to Expo
eas login

# Initialize the EAS project (creates projectId on Expo servers)
eas init
```

After `eas init`, it will output an EAS project ID. Paste it into `app.json`:

```json
"extra": {
  "eas": {
    "projectId": "paste-your-project-id-here"
  }
}
```

---

## 3. Insert Your AdMob IDs

Open `apps/mobile/src/lib/adUnitIds.ts` and replace the placeholder values:

```ts
export const AD_UNIT_IDS = {
  HOME_BANNER: 'ca-app-pub-XXXXXXXX/XXXXXXXXXX',       // Your real ID
  SEARCH_BANNER: 'ca-app-pub-XXXXXXXX/XXXXXXXXXX',
  ADD_MATCH_BANNER: 'ca-app-pub-XXXXXXXX/XXXXXXXXXX',
  LEADERBOARD_BANNER: 'ca-app-pub-XXXXXXXX/XXXXXXXXXX',
  SETTINGS_BANNER: 'ca-app-pub-XXXXXXXX/XXXXXXXXXX',
};
```

Also in `app.json`, replace the AdMob App ID:

```json
["react-native-google-mobile-ads", {
  "androidAppId": "ca-app-pub-XXXXXXXX~XXXXXXXXXX"
}]
```

> Test ads display automatically in `__DEV__` mode. Real ads only show in production builds.

---

## 4. Build the App

### Development Build (for testing with dev-client)

```bash
eas build -p android --profile development
```

This produces an APK you install on a physical device. Then run:

```bash
npx expo start --dev-client
```

### Preview Build (internal testing APK)

```bash
eas build -p android --profile preview
```

### Production Build (Play Store .aab)

```bash
eas build -p android --profile production
```

This creates a signed `.aab` (Android App Bundle) ready for the Play Store.

---

## 5. Create Your Play Store Listing

1. Go to [Google Play Console](https://play.google.com/console).
2. Click **Create app**.
3. Fill in:
   - **App name:** My Pickleball App
   - **Default language:** English (United States)
   - **App or Game:** App
   - **Free or Paid:** Free (if using ads)
4. Accept the declarations and click **Create app**.

---

## 6. Complete Store Listing Details

Navigate to **Grow** → **Store presence** → **Main store listing**:

| Field | Requirements |
|-------|-------------|
| **App title** | Max 30 characters |
| **Short description** | Max 80 characters |
| **Full description** | Max 4000 characters |
| **App icon** | 512 × 512 px, PNG, 32-bit, up to 1 MB |
| **Feature graphic** | 1024 × 500 px, PNG or JPEG |
| **Phone screenshots** | 2-8 screenshots, 16:9 or 9:16, min 320px, max 3840px per side |

---

## 7. Complete Required Declarations

### Content Rating

1. Go to **Policy** → **App content** → **Content rating**.
2. Start the questionnaire (IARC).
3. Answer honestly about your app content.
4. Submit — you'll receive a rating immediately.

### Data Safety

Go to **Policy** → **App content** → **Data safety** and declare:

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email address | Yes | No | Account management |
| Name / display name | Yes | No | App functionality |
| Push notification tokens | Yes | No | App functionality (notifications) |
| Game activity / match data | Yes | No | App functionality |
| Device identifiers | Yes | Yes (AdMob) | Advertising |
| Crash logs | Yes | No | Analytics / Diagnostics |

### Target Audience and Content

- Select the appropriate age group (likely 13+ due to competitive gaming).

### Ads Declaration

- Declare that your app contains ads (AdMob banners).

---

## 8. App Signing Setup

1. Go to **Setup** → **App signing**.
2. Opt in to **Google Play App Signing** (recommended — Google manages your signing key).
3. When using EAS Build, credentials are managed automatically. On first production build, EAS generates an upload key and you can link it to Play App Signing.

---

## 9. Upload Your App Bundle

### Option A: Via EAS Submit (Recommended)

```bash
eas submit -p android --profile production
```

On first run, EAS will guide you through creating a Google Play **Service Account**:

1. Go to Google Play Console → **Setup** → **API access**.
2. Click **Link** to connect to Google Cloud.
3. In Google Cloud Console, create a Service Account with the **Service Account User** role.
4. In the Google Play Console, grant the Service Account **Release manager** permissions.
5. Create a JSON key for the Service Account.
6. Save it as `apps/mobile/play-store-service-account.json` (already git-ignored).
7. EAS will use this to upload automatically.

### Option B: Manual Upload

1. Download the `.aab` from the [EAS dashboard](https://expo.dev).
2. In Play Console → **Release** → **Production** (or **Testing** → **Internal testing**).
3. Click **Create new release**.
4. Upload the `.aab` file.
5. Add release notes.
6. Click **Review release** → **Start rollout**.

---

## 10. Testing Before Public Release

### Internal Testing (Recommended First)

1. Go to **Testing** → **Internal testing**.
2. Create a track → add testers by email (up to 100).
3. Upload your `.aab` → publish.
4. Testers receive an invite link within minutes.

### Closed Testing

- Up to 2,000 testers per track.
- Requires the 20-tester requirement (14 days of testing with 20+ opted-in testers) before production access.

### Open Testing

- Anyone can join via a public opt-in link.

---

## 11. Go to Production

1. Ensure all policy declarations are complete (green checkmarks in the dashboard).
2. Go to **Release** → **Production** → **Create new release**.
3. Upload the `.aab` (or promote from a testing track).
4. Add release notes.
5. Select rollout percentage (start with 20%, then increase).
6. Click **Start rollout to production**.
7. Google review typically takes 1-3 days for new apps.

---

## 12. Post-Launch Checklist

- [x] **Privacy Policy** — Hosted at `docs/privacy-policy.md` via GitHub Pages. Add the URL to your Play Store listing.
- [ ] **AdMob app-ads.txt** — Add the app-ads.txt snippet from your AdMob account to your developer website (if you have one).
- [ ] **Monitor Android Vitals** — Play Console → **Quality** → **Android vitals**. Keep ANR rate < 0.47% and crash rate < 1.09%.
- [ ] **Respond to reviews** — Play Console → **Ratings and reviews**.
- [x] **Set up OTA updates** — `expo-updates` is configured. Push JS-only hotfixes with `eas update --channel production --message "description"`.
- [ ] **Version bumps** — For future releases, update `version` in `app.json`. The `versionCode` auto-increments via EAS (`autoIncrement: true` in `eas.json`).
- [x] **CI/CD** — GitHub Actions automatically builds and submits to Play Store on push to `main`. See [deployment-ci-cd-guide.md](deployment-ci-cd-guide.md).

---

## Quick Reference: Key Placeholder Values to Replace

| File | Placeholder | What to Insert |
|------|------------|----------------|
| `app.json` | `YOUR_EAS_PROJECT_ID` | From `eas init` output |
| `app.json` | `YOUR_ADMOB_ANDROID_APP_ID` | AdMob App ID (`ca-app-pub-XXXX~YYYY`) |
| `src/lib/adUnitIds.ts` | `YOUR_*_BANNER_AD_UNIT_ID` | 5 banner ad unit IDs from AdMob |
| `google-services.json` | (entire file) | Downloaded from Firebase Console |
| `play-store-service-account.json` | (entire file) | Created in Google Cloud Console |
