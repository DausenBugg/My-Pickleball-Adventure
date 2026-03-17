# Leveling system (XP)

## Goals
- Fast early progress.
- Increasing XP per level to create long-term challenge.
- Wins grant more XP than losses.

## XP per match
- Win: 120 XP
- Loss: 70 XP
- Ranked bonus: +20 XP

## Level curve
- Total XP threshold to reach each level:
  - Level 1 starts at $0$ XP
  - For level $N \ge 2$: $$XP(N) = \lceil 100 * N^{1.6} \rceil$$
- XP needed for next level:
  $$XP_{next}(N) = XP(N + 1) - currentXP$$

## Notes
- XP accrues for both casual and ranked matches.
- Pending matches do not award XP until approved.
- Backend source of truth is `add_xp_and_recalculate` in the Supabase migration.
