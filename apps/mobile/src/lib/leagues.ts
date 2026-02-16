/**
 * League System for Elo Ratings
 * 
 * Players are assigned leagues based on their rating.
 * The #1 ranked player is always Grandmaster, regardless of rating.
 */

export type LeagueName = 'bronze' | 'silver' | 'gold' | 'diamond' | 'emerald' | 'cosmic' | 'grandmaster';

export interface League {
  name: LeagueName;
  displayName: string;
  minRating: number;
  maxRating: number | null; // null = no upper limit
  color: string;
}

/**
 * League definitions ordered from lowest to highest rating
 */
export const LEAGUES: Record<LeagueName, League> = {
  bronze: {
    name: 'bronze',
    displayName: 'Bronze',
    minRating: 0,
    maxRating: 999,
    color: '#cd7f32',
  },
  silver: {
    name: 'silver',
    displayName: 'Silver',
    minRating: 1000,
    maxRating: 1199,
    color: '#a8a8a8',
  },
  gold: {
    name: 'gold',
    displayName: 'Gold',
    minRating: 1200,
    maxRating: 1399,
    color: '#ffd700',
  },
  diamond: {
    name: 'diamond',
    displayName: 'Diamond',
    minRating: 1400,
    maxRating: 1599,
    color: '#4fc3f7',
  },
  emerald: {
    name: 'emerald',
    displayName: 'Emerald',
    minRating: 1600,
    maxRating: 1799,
    color: '#50c878',
  },
  cosmic: {
    name: 'cosmic',
    displayName: 'Cosmic',
    minRating: 1800,
    maxRating: null,
    color: '#9333ea',
  },
  grandmaster: {
    name: 'grandmaster',
    displayName: 'Grandmaster',
    minRating: 0, // Special: rank-based, not rating-based
    maxRating: null,
    color: '#ff4500',
  },
};

/**
 * Ordered list of leagues by rating threshold (excluding grandmaster)
 */
const LEAGUE_ORDER: LeagueName[] = ['bronze', 'silver', 'gold', 'diamond', 'emerald', 'cosmic'];

/**
 * Get the league for a given rating and optional rank.
 * Rank 1 is always Grandmaster, regardless of rating.
 * 
 * @param rating - The player's Elo rating
 * @param rank - Optional global rank (1 = top player)
 * @returns The league information
 */
export function getLeagueForRating(rating: number, rank?: number): League {
  // Rank #1 is always Grandmaster
  if (rank === 1) {
    return LEAGUES.grandmaster;
  }

  // Find the appropriate league based on rating
  for (let i = LEAGUE_ORDER.length - 1; i >= 0; i--) {
    const leagueName = LEAGUE_ORDER[i];
    const league = LEAGUES[leagueName];
    if (rating >= league.minRating) {
      return league;
    }
  }

  // Fallback to bronze
  return LEAGUES.bronze;
}

/**
 * Get the rating needed to reach the next league.
 * Returns null if already at the highest rating-based league (Cosmic).
 * 
 * @param rating - Current rating
 * @returns Rating needed for next league, or null if at max
 */
export function getRatingToNextLeague(rating: number): { nextLeague: League; ratingNeeded: number } | null {
  const currentLeague = getLeagueForRating(rating);
  const currentIndex = LEAGUE_ORDER.indexOf(currentLeague.name);
  
  // Already at Cosmic (highest rating-based league)
  if (currentIndex === LEAGUE_ORDER.length - 1 || currentLeague.name === 'cosmic') {
    return null;
  }

  // At Grandmaster doesn't count - find actual rating league
  if (currentLeague.name === 'grandmaster') {
    const ratingLeague = getLeagueForRating(rating, undefined);
    const ratingLeagueIndex = LEAGUE_ORDER.indexOf(ratingLeague.name);
    if (ratingLeagueIndex >= LEAGUE_ORDER.length - 1) {
      return null;
    }
    const nextLeague = LEAGUES[LEAGUE_ORDER[ratingLeagueIndex + 1]];
    return {
      nextLeague,
      ratingNeeded: nextLeague.minRating - rating,
    };
  }

  const nextLeague = LEAGUES[LEAGUE_ORDER[currentIndex + 1]];
  return {
    nextLeague,
    ratingNeeded: nextLeague.minRating - rating,
  };
}

/**
 * Get a short description of the league.
 */
export function getLeagueDescription(league: League): string {
  switch (league.name) {
    case 'bronze':
      return 'Starting your journey';
    case 'silver':
      return 'Building skills';
    case 'gold':
      return 'Solid competitor';
    case 'diamond':
      return 'Elite player';
    case 'emerald':
      return 'Top tier';
    case 'cosmic':
      return 'Among the best';
    case 'grandmaster':
      return '#1 Ranked Player';
    default:
      return '';
  }
}
