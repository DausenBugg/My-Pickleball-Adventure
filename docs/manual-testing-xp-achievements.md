# Manual Testing Guide: XP + Achievements (Complete)

This document is a full manual QA checklist for XP and achievements, including expected XP totals and expected achievements unlocked.

## 1) Source of truth used

- `supabase/functions/process-match-approval/index.ts`
- `supabase/functions/check-achievements/index.ts`
- `supabase/functions/claim-achievement-reward/index.ts`
- `supabase/migrations/20260308000001_initial_schema.sql`
- `apps/mobile/src/hooks/useAchievements.ts`

## 2) Core rules to validate

## 2.1 Match XP awards

- Casual win: **+120 XP**
- Casual loss: **+70 XP**
- Ranked win: **+140 XP** (120 + 20 ranked bonus)
- Ranked loss: **+90 XP** (70 + 20 ranked bonus)
- Invalidated/deleted match: **+0 XP**
- Pending (not enough approvals): **+0 XP**

## 2.2 Achievement XP rewards (claim time)

- Bronze: **+50 XP**
- Silver: **+100 XP**
- Gold: **+200 XP**
- Platinum: **+500 XP**

Important: unlocking an achievement does **not** add XP immediately. XP is added only when user taps **Claim XP**.

## 2.3 Level thresholds (backend behavior)

Backend function `add_xp_and_recalculate` uses loop condition:

- reach level `N` when total XP is at least `ceil(100 * N^1.6)`

Milestones used by level achievements:

| Level | Minimum total XP |
|---|---:|
| 5 | 1314 |
| 10 | 3982 |
| 25 | 17247 |
| 50 | 52282 |
| 75 | 100023 |
| 100 | 158490 |

## 2.4 Total claimable XP from all achievements

There are 32 achievements total:

- Bronze: 9 × 50 = 450
- Silver: 7 × 100 = 700
- Gold: 8 × 200 = 1600
- Platinum: 8 × 500 = 4000

**Grand total achievement XP = 6750**

---

## 3) Achievement catalog (exhaustive)

Use this table as the complete unlock matrix.

| Key | Name | Requirement | Tier | Claim XP |
|---|---|---|---|---:|
| first_match | First Match | games_played >= 1 | bronze | 50 |
| matches_10 | Regular Player | games_played >= 10 | bronze | 50 |
| matches_25 | Dedicated | games_played >= 25 | silver | 100 |
| matches_50 | Half Century | games_played >= 50 | silver | 100 |
| matches_100 | Century Club | games_played >= 100 | platinum | 500 |
| matches_250 | Veteran | games_played >= 250 | gold | 200 |
| matches_500 | Pickleball Fanatic | games_played >= 500 | platinum | 500 |
| first_win | First Victory | wins >= 1 | bronze | 50 |
| wins_10 | Double Digits | wins >= 10 | bronze | 50 |
| wins_25 | Quarter Century | wins >= 25 | silver | 100 |
| wins_50 | Fifty Wins | wins >= 50 | gold | 200 |
| wins_100 | Centurion | wins >= 100 | platinum | 500 |
| win_streak_3 | Hot Streak | best_win_streak >= 3 | bronze | 50 |
| win_streak_5 | On Fire | best_win_streak >= 5 | silver | 100 |
| win_streak_10 | Unstoppable | best_win_streak >= 10 | gold | 200 |
| level_5 | Getting Started | level >= 5 | bronze | 50 |
| level_10 | Level 10 | level >= 10 | silver | 100 |
| level_25 | Level 25 | level >= 25 | gold | 200 |
| level_50 | Halfway There | level >= 50 | gold | 200 |
| level_75 | Veteran Status | level >= 75 | platinum | 500 |
| level_100 | Max Prestige | level >= 100 | platinum | 500 |
| rating_1300 | Rising Star | rating >= 1300 | bronze | 50 |
| rating_1400 | Competitor | rating >= 1400 | silver | 100 |
| rating_1500 | Rating 1500 | rating >= 1500 | gold | 200 |
| rating_1600 | Sharpshooter | rating >= 1600 | gold | 200 |
| rating_1750 | Expert | rating >= 1750 | platinum | 500 |
| rating_2000 | Grand Master | rating >= 2000 | platinum | 500 |
| friend_1 | First Friend | friends >= 1 | bronze | 50 |
| friend_5 | Making Friends | friends >= 5 | bronze | 50 |
| friend_count_10 | Social Butterfly | friends >= 10 | silver | 100 |
| friend_25 | Popular | friends >= 25 | gold | 200 |
| friend_50 | Life of the Party | friends >= 50 | platinum | 500 |

---

## 4) Complete manual test suites

## Suite A — Match approval and XP (all result paths)

Run each case from clean preconditions (or record starting XP and validate delta).

| Case | Setup | Action | Expected result |
|---|---|---|---|
| A1 | Singles casual, user wins, approvals = 2/2 | Trigger `process-match-approval` | Match approved, XP event +120 |
| A2 | Singles casual, user loses, approvals = 2/2 | Trigger approval | Match approved, XP event +70 |
| A3 | Singles ranked, user wins, approvals = 2/2 | Trigger approval | Match approved, XP event +140 |
| A4 | Singles ranked, user loses, approvals = 2/2 | Trigger approval | Match approved, XP event +90 |
| A5 | Doubles casual, user wins, approvals = 3/4 | Trigger approval | Match approved, XP event +120 |
| A6 | Doubles casual, user loses, approvals = 3/4 | Trigger approval | Match approved, XP event +70 |
| A7 | Doubles ranked, user wins, approvals = 3/4 | Trigger approval | Match approved, XP event +140 |
| A8 | Doubles ranked, user loses, approvals = 3/4 | Trigger approval | Match approved, XP event +90 |
| A9 | Singles: 1 reject OR Doubles: 2 rejects | Trigger approval | Match is invalidated and deleted, XP +0 |
| A10 | Any mode, insufficient approvals, no reject | Trigger approval | Response "Not enough approvals yet", XP +0 |
| A11 | Non-participant calls function | Invoke function | 403 not authorized, XP +0 |
| A12 | Invalid matchId UUID | Invoke function | 400 invalid match ID, XP +0 |

Validation for each A-case:

1. `xp_events` row delta matches expected XP.
2. `profiles.total_xp` increases by expected XP.
3. `profiles.level` changes only if threshold crossed.
4. `matches` row outcome is correct (`approved`/deleted/unchanged pending).

## Suite B — Achievement unlock + claim (all 32 achievements)

For every achievement in Section 3, execute the same pattern:

1. Set user just below threshold (requirement - 1).
2. Perform one action to cross threshold (approved match, friend accept, or rating/level increase).
3. Open Achievements screen and verify card moved to unlocked.
4. Verify XP is unchanged at unlock moment.
5. Tap **Claim XP**.
6. Verify `claimed_at` is set and XP increased by tier value.

Expected per-achievement outputs (exhaustive):

- On unlock: `user_achievements` adds one row, unlocked count +1, XP delta **0**.
- On claim: XP delta equals Claim XP column in Section 3.
- On second claim attempt: blocked (409), XP delta **0**.

### B-subsuite expected unlocked counts and claim XP by group

| Group | Achievements in group | Group total claim XP |
|---|---:|---:|
| games_played | 7 | 1500 |
| wins | 5 | 900 |
| win_streak | 3 | 350 |
| level | 6 | 1550 |
| rating | 6 | 1550 |
| friends | 5 | 900 |
| all groups | 32 | 6750 |

## Suite C — Negative/idempotency cases (required)

| Case | Action | Expected result |
|---|---|---|
| C1 | Claim achievement not unlocked | 404, no XP change |
| C2 | Claim with invalid achievement UUID | 400, no XP change |
| C3 | Claim already-claimed achievement | 409, no XP change |
| C4 | Call `check-achievements` for user already at threshold | No duplicate `user_achievements` rows |
| C5 | Re-run `process-match-approval` after already approved | "Match is not pending", no extra XP |
| C6 | Re-run `process-match-approval` after invalidation/deletion | "Match not found", no extra XP |
| C7 | Unlock multiple achievements in one event | All applicable unlocks appear, XP still 0 until claims |
| C8 | Claim multiple unlocked achievements sequentially | Total XP increase = sum of all claimed tiers |

---

## 5) Expected total XP + unlocked counts (milestone scenarios)

These are deterministic checkpoints you can use as fast sanity runs.

## Scenario S1 — all matches are casual losses (claim games_played rewards immediately)

| Matches played | Match XP total | Achievement XP claimed | Total XP expected | Achievements unlocked |
|---:|---:|---:|---:|---:|
| 1 | 70 | 50 (first_match) | 120 | 1 |
| 10 | 700 | 100 (first_match, matches_10) | 800 | 2 |
| 25 | 1750 | 200 (+matches_25) | 1950 | 3 |
| 50 | 3500 | 300 (+matches_50) | 3800 | 4 |
| 100 | 7000 | 800 (+matches_100) | 7800 | 5 |
| 250 | 17500 | 1000 (+matches_250) | 18500 | 6 |
| 500 | 35000 | 1500 (+matches_500) | 36500 | 7 |

## Scenario S2 — all matches are casual wins (no streak breaks, claim immediately)

Includes games_played + wins + win_streak achievements.

| Wins (matches) | Match XP total | Achievement XP claimed cumulative | Total XP expected | Achievements unlocked |
|---:|---:|---:|---:|---:|
| 1 | 120 | 100 (first_match, first_win) | 220 | 2 |
| 3 | 360 | 150 (+win_streak_3) | 510 | 3 |
| 5 | 600 | 250 (+win_streak_5) | 850 | 4 |
| 10 | 1200 | 550 (+matches_10, wins_10, win_streak_10) | 1750 | 7 |
| 25 | 3000 | 750 (+matches_25, wins_25) | 3750 | 9 |
| 50 | 6000 | 1050 (+matches_50, wins_50) | 7050 | 11 |
| 100 | 12000 | 2050 (+matches_100, wins_100) | 14050 | 13 |
| 250 | 30000 | 2250 (+matches_250) | 32250 | 14 |
| 500 | 60000 | 2750 (+matches_500) | 62750 | 15 |

## Scenario S3 — all matches are ranked wins (no streak breaks, claim immediately)

Same unlock counts as S2, but match XP is higher.

Formula:

- Total XP = `140 * wins + cumulative_achievement_claim_xp`

Example checkpoints:

| Wins | Match XP total | Achievement XP claimed cumulative | Total XP expected | Achievements unlocked |
|---:|---:|---:|---:|---:|
| 1 | 140 | 100 | 240 | 2 |
| 10 | 1400 | 550 | 1950 | 7 |
| 100 | 14000 | 2050 | 16050 | 13 |

---

## 6) Final completion criteria (100% pass)

Testing is fully complete when all are true:

1. All A-cases pass with exact XP deltas.
2. All 32 achievements can be unlocked.
3. All 32 achievements can be claimed exactly once.
4. Aggregate claim XP across all achievements equals **6750**.
5. No duplicate XP from reprocessing or re-claiming.
6. Scenario totals in Section 5 match observed values.

If all criteria pass, XP + achievements system is validated end-to-end.