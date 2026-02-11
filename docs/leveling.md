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
- Total XP required for level N:
  $$XP(N) = 100 * N^{1.6}$$
- XP to next level:
  $$XP_{next}(N) = XP(N + 1) - XP(N)$$

## Notes
- XP accrues for both casual and ranked matches.
- Pending matches do not award XP until approved.
