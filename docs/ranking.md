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

## Notes
- Rating updates run server-side in Edge Functions after approvals.
