# Ranking system (Elo-style)

## Overview
Ranked matches update a separate rating from the leveling XP system. Ratings only update after approval quorum.

## Core formula
- Expected score for player A: $E_A = 1 / (1 + 10^{(R_B - R_A)/400})$
- New rating: $R_A' = R_A + K * (S_A - E_A)$
- $S_A$ is 1 for win, 0 for loss.

## K-factor
- K starts higher for new players and declines with games played.
- Example bands:
  - 0-10 ranked games: K = 40
  - 11-30 ranked games: K = 28
  - 31+ ranked games: K = 20

## Doubles handling
- Team rating = average of team member ratings.
- Expected score uses team ratings.
- Rating change is applied to each member based on team outcome.

## Rubber band / anti-abuse rules
- Daily rating gain cap (example: +80 per day).
- Repeat-opponent dampening: matches vs the same opponent within 7 days apply 50% rating change after the first match.
- Self-play prevention: cannot submit matches where the same user appears on both teams.
- Pending matches do not affect ratings.

## Approval gating
- Singles: both players must approve.
- Doubles: 3 of 4 approvals required.
- Submitter auto-approves on submission.

## League System
Players are assigned to leagues based on their Elo rating. Leagues provide a visual representation of skill level with league-colored text displayed for ratings.

### League Tiers
| League | Rating Range | Color | Description |
|--------|--------------|-------|-------------|
| Bronze | 0-999 | Bronze | Starting your journey |
| Silver | 1000-1199 | Silver | Building skills |
| Gold | 1200-1399 | Gold | Solid competitor |
| Diamond | 1400-1599 | Light Blue | Elite player |
| Emerald | 1600-1799 | Green | Top tier |
| Cosmic | 1800+ | Purple | Among the best |
| Grandmaster | Rank #1 | Orange-Red | #1 Ranked Player |

### Special Rules
- **Grandmaster** is reserved for the #1 globally ranked player, regardless of rating.
- Rating text appears in league-specific colors on the home screen and leaderboard.
- Progressing to a new league provides visual feedback of improvement.

## Notes
- Rating updates run server-side in Edge Functions after approvals.
