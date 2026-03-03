# Deployment & CI/CD Guide

A complete step-by-step reference for building, deploying, and maintaining **My Pickleball App** (mobile + watch) on the Google Play Store using GitHub Actions and Expo EAS.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [One-Time Setup](#3-one-time-setup)
   - 3a. Create an EAS Access Token
   - 3b. Create a Google Play Developer Account
   - 3c. Create App Listings in Play Console
   - 3d. Create a Google Cloud Service Account
   - 3e. Base64-Encode Your Secret Files
   - 3f. Add GitHub Repository Secrets
   - 3g. Enable GitHub Pages (Privacy Policy)
4. [Day-to-Day Workflow](#4-day-to-day-workflow)
5. [OTA Updates (expo-updates)](#5-ota-updates)
6. [Manual Commands (Fallback)](#6-manual-commands)
7. [Promoting Releases in Play Console](#7-promoting-releases-in-play-console)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Architecture Overview

```
┌─────────────────┐     push to main     ┌──────────────────────┐
│  Local Dev       │ ──────────────────►  │  GitHub Actions      │
│  (your machine)  │                      │                      │
└─────────────────┘                       │  1. TypeScript check │
                                          │  2. eas build        │
                                          │  3. eas submit       │
                                          └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  EAS Build (cloud)   │
                                          │  Produces .aab       │
                                          └──────────┬───────────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  Google Play Console │
                                          │  Internal track      │
                                          └──────────────────────┘
```

**Two workflows:**

| Workflow | File | Trigger | What it does |
|----------|------|---------|-------------|
| **CI** | `.github/workflows/ci.yml` | Every push + PR to `main` | TypeScript checks for both apps |
| **Deploy** | `.github/workflows/deploy.yml` | Push to `main` only | TypeScript checks → EAS Build → EAS Submit (both apps in parallel) |

---

## 2. Prerequisites

Before starting, make sure you have:

- [ ] **Node.js 20+** installed
- [ ] **EAS CLI** installed globally: `npm install -g eas-cli`
- [ ] **Expo account** — [expo.dev/signup](https://expo.dev/signup)
- [ ] **Google Play Developer account** ($25 one-time) — [play.google.com/console](https://play.google.com/console)
- [ ] **GitHub repository** with the project pushed to `main`
- [ ] **Supabase project** running with all migrations applied

---

## 3. One-Time Setup

### 3a. Create an EAS Access Token

GitHub Actions needs to authenticate with Expo/EAS. Create a personal access token:

1. Go to [expo.dev](https://expo.dev) and sign in.
2. Click your avatar (top right) → **Account Settings**.
3. In the left sidebar, click **Access Tokens**.
4. Click **Create Token**.
5. Name it `GitHub Actions` and click **Create**.
6. **Copy the token immediately** — you won't be able to see it again.

Save it; you'll add it as a GitHub Secret in step 3f.

### 3b. Create a Google Play Developer Account

1. Go to [play.google.com/console](https://play.google.com/console).
2. Pay the $25 one-time registration fee.
3. Complete identity verification (may take 1–2 days for new accounts).

### 3c. Create App Listings in Play Console

You need **two** app listings (mobile + watch):

#### Mobile App
1. In Play Console, click **Create app**.
2. Fill in:
   - **App name:** My Pickleball App
   - **Default language:** English (United States)
   - **App or Game:** App
   - **Free or Paid:** Free
3. Accept declarations → **Create app**.
4. Complete all required sections (see [play-store-guide.md](play-store-guide.md) for details):
   - Store listing (title, descriptions, screenshots, feature graphic)
   - Content rating (IARC questionnaire)
   - Data safety declarations
   - Ads declaration (your app contains ads)
   - Target audience: 13+
   - Privacy policy URL (your GitHub Pages URL — see step 3g)
   - App signing: opt in to **Google Play App Signing**

#### Watch App
1. Repeat the same process with:
   - **App name:** My Pickleball Watch
   - Same declarations as above (minus AdMob ads)

### 3d. Create a Google Cloud Service Account

This allows EAS to upload builds to Play Console automatically:

1. In **Google Play Console** → **Setup** → **API access**.
2. Click **Link** to connect to a Google Cloud project (or create one).
3. In the **Google Cloud Console** that opens:
   - Go to **IAM & Admin** → **Service Accounts**.
   - Click **Create Service Account**.
   - Name: `eas-play-store-upload`
   - Role: **Service Account User**
   - Click **Done**.
4. Click the newly created service account → **Keys** tab.
5. Click **Add Key** → **Create new key** → **JSON** → **Create**.
6. A `.json` file downloads — this is your service account key.
7. Rename it to `play-store-service-account.json`.
8. Back in **Google Play Console** → **Setup** → **API access**:
   - Find the service account you just created.
   - Click **Manage Play Console permissions**.
   - Grant **Release manager** permission for both apps (or grant at account level).
   - Click **Invite user** → **Send invite**.

> **Important:** Keep `play-store-service-account.json` secure. Never commit it to git (it's already in `.gitignore`).

### 3e. Base64-Encode Your Secret Files

GitHub Actions secrets are plain text, so binary/multiline files need to be base64-encoded.

#### On macOS / Linux:
```bash
base64 -w 0 play-store-service-account.json > service-account-base64.txt
```

#### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("play-store-service-account.json")) | Set-Content service-account-base64.txt
```

You'll paste the contents of this `.txt` file into a GitHub Secret next.

> **Note:** `google-services.json` is tracked in git (it's client-side Firebase config, safe to commit). No need to base64-encode it.

### 3f. Add GitHub Repository Secrets

1. Go to your GitHub repository page.
2. Click **Settings** (tab at the top, far right).
3. In the left sidebar, expand **Secrets and variables** → click **Actions**.
4. Click **New repository secret** for each of the following:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `EXPO_TOKEN` | Your EAS access token (from step 3a) | Copied from expo.dev |

| `PLAY_STORE_SERVICE_ACCOUNT_BASE64` | Contents of `service-account-base64.txt` | From step 3e |
| `SUPABASE_URL` | `https://fkvoktpgrkgwedvgnibt.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Same location |

**Adding a secret (step by step):**
1. Click **New repository secret**.
2. In the **Name** field, type the exact secret name (e.g., `EXPO_TOKEN`).
3. In the **Secret** field, paste the value.
4. Click **Add secret**.
5. Repeat for each secret.

> **Tip:** After adding all 4 secrets, your Secrets page should show exactly these 4 entries. You can update a secret at any time by clicking the pencil icon next to it.

### 3g. Enable GitHub Pages (Privacy Policy)

Host the privacy policy directly from your repo:

1. Go to your GitHub repository → **Settings** → **Pages** (left sidebar).
2. Under **Source**, select **Deploy from a branch**.
3. **Branch:** `main`, **Folder:** `/docs`.
4. Click **Save**.
5. Wait 1–2 minutes, then visit:
   ```
   https://<your-github-username>.github.io/My-Pickleball-Adventure/privacy-policy
   ```
6. Copy this URL — you'll need it for the Play Store listing (Privacy Policy URL field).

---

## 4. Day-to-Day Workflow

Once setup is complete, deploying is automatic:

### Making Changes
1. Create a feature branch:
   ```bash
   git checkout -b feature/my-change
   ```
2. Make your changes and commit.
3. Push the branch:
   ```bash
   git push origin feature/my-change
   ```
4. Open a **Pull Request** to `main`.
   - The **CI** workflow runs automatically (TypeScript checks).
   - Review the checks pass (green checkmark on the PR).
5. Merge the PR into `main`.
   - The **Deploy** workflow triggers automatically.
   - Builds both apps and submits to Play Store internal track.

### Monitoring Builds
- **GitHub Actions:** Go to your repo → **Actions** tab → click the running workflow to see logs.
- **EAS Dashboard:** Go to [expo.dev](https://expo.dev) → your project → **Builds** to see build status and download artifacts.
- **Play Console:** Go to **Release** → **Internal testing** to see uploaded builds.

### Version Bumps

**For app-store-visible version changes** (e.g., 1.0.0 → 1.1.0):
1. Update `version` in `apps/mobile/app.json` and `apps/watch/app.json`:
   ```json
   "version": "1.1.0"
   ```
2. Commit and push to `main`.
3. EAS automatically increments the internal `versionCode`.

---

## 5. OTA Updates

For **JavaScript-only changes** (no native code changes), you can push updates instantly without going through the Play Store review:

```bash
# From apps/mobile/
cd apps/mobile
eas update --channel production --message "Fix leaderboard sorting"

# From apps/watch/
cd apps/watch
eas update --channel production --message "Fix approval screen"
```

**When to use OTA vs full build:**

| Change Type | Method |
|-------------|--------|
| Bug fix in JS/TS code | `eas update` (instant) |
| New feature in JS/TS | `eas update` (instant) |
| New native dependency (npm package with native code) | Full build (push to `main`) |
| Change in `app.json` (version, plugins, etc.) | Full build (push to `main`) |
| Asset changes (new images, fonts) | Full build (push to `main`) |

Users will receive the update the next time they open the app.

---

## 6. Manual Commands (Fallback)

If CI/CD is down or you need to build/submit locally:

```bash
# ── Mobile App ──
cd apps/mobile

# Build production .aab
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production

# ── Watch App ──
cd apps/watch

# Build production .aab
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

Make sure you have `google-services.json`, `play-store-service-account.json`, and `.env` files present locally.

---

## 7. Promoting Releases in Play Console

The CI/CD pipeline submits to the **internal testing** track. To go to production:

### Internal → Closed Testing
1. Play Console → **Testing** → **Internal testing**.
2. Verify the build works with your testers.
3. Click **Promote release** → **Closed testing**.

### Closed Testing → Production
1. You need **20 testers who have opted in and tested for at least 14 consecutive days** (Google's requirement for new apps).
2. Once met, go to **Testing** → **Closed testing**.
3. Click **Promote release** → **Production**.
4. Set rollout percentage (start with 20%, then increase).
5. Click **Start rollout to production**.

### Review Timeline
- **New apps:** 1–3 days for first review.
- **Updates to existing apps:** Usually 1–24 hours.

---

## 8. Troubleshooting

### Build fails with "credentials not found"
- Verify `EXPO_TOKEN` secret is set correctly in GitHub repo settings.
- Regenerate the token at [expo.dev](https://expo.dev) if expired.

### Build fails with "google-services.json not found"
- Verify `GOOGLE_SERVICES_JSON_BASE64` secret is properly base64-encoded.
- Test decoding locally:
  ```bash
  echo "YOUR_BASE64_STRING" | base64 --decode > test.json
  cat test.json  # Should be valid JSON
  ```

### Submit fails with "permission denied"
- Verify the service account has **Release manager** permissions in Play Console.
- Check that `PLAY_STORE_SERVICE_ACCOUNT_BASE64` is the correct JSON key.

### Submit fails with "app not found"
- Ensure you've created the app listing in Play Console with the exact package name:
  - Mobile: `com.dbugg.mypickleballadventure`
  - Watch: `com.dbugg.mypickleballwatch`

### OTA update not appearing for users
- Verify channel matches: `eas update --channel production`.
- Check that the app was built with the same `runtimeVersion`.
- Users need to close and reopen the app to receive updates.

### TypeScript check fails in CI
- Run locally first: `cd apps/mobile && npx tsc --noEmit`
- Fix all errors before pushing.

### Dependency conflict (peer deps)
- Use `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`
- The CI workflows already include this flag.

---

## Quick Reference: GitHub Secrets Checklist

| # | Secret Name | Status |
|---|-------------|--------|
| 1 | `EXPO_TOKEN` | ☐ Added |
| 2 | `PLAY_STORE_SERVICE_ACCOUNT_BASE64` | ☐ Added |
| 3 | `SUPABASE_URL` | ☐ Added |
| 4 | `SUPABASE_ANON_KEY` | ☐ Added |

## Quick Reference: Play Console Checklist

| # | Task | Mobile | Watch |
|---|------|--------|-------|
| 1 | Create app listing | ☐ | ☐ |
| 2 | Store listing (title, descriptions, screenshots) | ☐ | ☐ |
| 3 | Content rating (IARC) | ☐ | ☐ |
| 4 | Data safety declarations | ☐ | ☐ |
| 5 | Ads declaration | ☐ | N/A |
| 6 | Target audience (13+) | ☐ | ☐ |
| 7 | Privacy policy URL | ☐ | ☐ |
| 8 | App signing opt-in | ☐ | ☐ |
| 9 | Service account permissions | ☐ | ☐ |
| 10 | Internal testing (20 testers, 14 days) | ☐ | ☐ |
