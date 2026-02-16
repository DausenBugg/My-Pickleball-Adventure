import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { getLeagueForRating } from '../lib/leagues';
import { radii, typography } from '../theme/tokens';

interface LeagueRatingDisplayProps {
  /** Player's rating */
  rating: number;
  /** Player's global rank (1 = Grandmaster) */
  rank?: number;
  /** Size of the display */
  size?: 'sm' | 'md' | 'lg';
  /** Custom style */
  style?: ViewStyle;
  /** Rating text color (default white) */
  ratingColor?: string;
}

const SIZE_MAP = {
  sm: { ratingFont: 12, labelFont: 10 },
  md: { ratingFont: 14, labelFont: 12 },
  lg: { ratingFont: 18, labelFont: 14 },
};

/**
 * LeagueRatingDisplay shows rating (white) with league title (league color) next to it.
 * 
 * Usage:
 * ```tsx
 * <LeagueRatingDisplay rating={1450} rank={5} />
 * <LeagueRatingDisplay rating={1850} size="lg" />
 * ```
 */
export function LeagueRatingDisplay({
  rating,
  rank,
  size = 'md',
  style,
  ratingColor = '#ffffff',
}: LeagueRatingDisplayProps) {
  const league = getLeagueForRating(rating, rank);
  const dimensions = SIZE_MAP[size];
  
  return (
    <View style={[styles.rowContainer, style]}>
      <Text style={[styles.ratingText, { fontSize: dimensions.ratingFont, color: ratingColor }]}>
        {rating}
      </Text>
      <Text style={[styles.labelText, { fontSize: dimensions.labelFont, color: league.color }]}>
        {league.displayName}
      </Text>
    </View>
  );
}

/**
 * Compact inline display for lists/leaderboards - rating (ink/white) + league title (colored)
 */
export function LeagueInlineBadge({
  rating,
  rank,
  ratingColor = '#ffffff',
}: {
  rating: number;
  rank?: number;
  ratingColor?: string;
}) {
  const league = getLeagueForRating(rating, rank);
  
  return (
    <View style={styles.inlineContainer}>
      <Text style={[styles.inlineRating, { color: ratingColor }]}>{rating}</Text>
      <Text style={[styles.inlineLabel, { color: league.color }]}>{league.displayName}</Text>
    </View>
  );
}

/**
 * Rating badge with league colors - for leaderboards/podium
 * Shows rating in white with league title colored below
 */
export function LeagueRatingBadge({
  rating,
  rank,
}: {
  rating: number;
  rank?: number;
}) {
  const league = getLeagueForRating(rating, rank);
  
  return (
    <View style={styles.badgeContainer}>
      <View style={[styles.ratingBadge, { backgroundColor: colors.badgeBg }]}>
        <Text style={styles.ratingBadgeText}>{rating}</Text>
      </View>
      <Text style={[styles.badgeLabel, { color: league.color }]}>{league.displayName}</Text>
    </View>
  );
}

/**
 * League name text with appropriate color
 */
export function LeagueLabel({
  rating,
  rank,
  size = 'md',
}: {
  rating: number;
  rank?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const league = getLeagueForRating(rating, rank);
  const dimensions = SIZE_MAP[size];
  
  return (
    <Text style={[styles.labelText, { fontSize: dimensions.labelFont, color: league.color }]}>
      {league.displayName}
    </Text>
  );
}

// Simple color constants for badge background
const colors = {
  badgeBg: '#1a73e8',
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontWeight: typography.weights.bold,
  },
  labelText: {
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineRating: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  inlineLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badgeContainer: {
    alignItems: 'center',
    gap: 2,
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  ratingBadgeText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  badgeLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

// Legacy export for backwards compatibility
export const LeagueBadge = LeagueRatingDisplay;
export default LeagueRatingDisplay;
