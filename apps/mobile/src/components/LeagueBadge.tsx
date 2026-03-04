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
  sm: { ratingFont: 12, labelFont: 10, gap: 4 },
  md: { ratingFont: 14, labelFont: 12, gap: 6 },
  lg: { ratingFont: 18, labelFont: 14, gap: 8 },
};

/**
 * LeagueRatingDisplay shows rating (white) with league title (league color) next to it.
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
    <View style={[styles.rowContainer, { gap: dimensions.gap }, style]}>
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
 * Compact inline badge for lists/leaderboards.
 * League-tinted pill with rating + league name.
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
    <View
      style={[
        styles.inlineContainer,
        { backgroundColor: league.color + '18', borderColor: league.color + '50' },
      ]}
    >
      <Text style={[styles.inlineRating, { color: ratingColor }]}>{rating}</Text>
      <Text style={[styles.inlineLabel, { color: league.color }]}>{league.displayName}</Text>
    </View>
  );
}

/**
 * Rating badge with league-colored pill — for leaderboards/podium/profile.
 * Shows rating inside a translucent league-tinted pill,
 * with the league name in league color below.
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
      <View
        style={[
          styles.ratingBadge,
          { backgroundColor: league.color + '20', borderColor: league.color + '55', borderWidth: 1 },
        ]}
      >
        <Text style={styles.ratingBadgeText}>{rating}</Text>
      </View>
      <Text style={[styles.badgeLabel, { color: league.color }]}>{league.displayName}</Text>
    </View>
  );
}

/**
 * League name text with appropriate color.
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

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
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
    gap: 3,
  },
  ratingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
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
