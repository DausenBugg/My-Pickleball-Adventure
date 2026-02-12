import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  calculateLevelProgress,
  calculateXPForLevel,
  calculateXPToNextLevel,
  useProfile,
  useRating,
} from '../../src/hooks/useProfile';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function HomeScreen() {
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const { rating, loading: ratingLoading } = useRating();

  const loading = profileLoading || ratingLoading;

  const xpToNext = useMemo(() => {
    if (!profile) return 0;
    return calculateXPToNextLevel(profile.level, profile.total_xp);
  }, [profile]);

  const levelProgress = useMemo(() => {
    if (!profile) return 0;
    return calculateLevelProgress(profile.level, profile.total_xp);
  }, [profile]);

  const xpForCurrentLevel = useMemo(() => {
    if (!profile) return 0;
    return calculateXPForLevel(profile.level);
  }, [profile]);

  const xpForNextLevel = useMemo(() => {
    if (!profile) return 0;
    return calculateXPForLevel(profile.level + 1);
  }, [profile]);

  const xpInCurrentLevel = useMemo(() => {
    if (!profile) return 0;
    return profile.total_xp - xpForCurrentLevel;
  }, [profile, xpForCurrentLevel]);

  const xpNeededForLevel = useMemo(() => {
    if (!profile) return 0;
    return xpForNextLevel - xpForCurrentLevel;
  }, [xpForCurrentLevel, xpForNextLevel]);

  // Estimate wins needed (assuming 120 XP per win)
  const winsToNext = useMemo(() => Math.ceil(xpToNext / 120), [xpToNext]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.blue} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile data</Text>
          <Text style={styles.errorHint}>
            Make sure you've run the database migrations
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No profile found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} colors={[colors.blue]} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your KPIs</Text>
            <Text style={styles.subtitle}>
              {profile.full_name || 'Player'}'s overview
            </Text>
          </View>
          <View style={styles.rankPill}>
            <Text style={styles.rankLabel}>Rating</Text>
            <Text style={styles.rankValue}>{rating?.rating ?? 1200}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Wins</Text>
            <Text style={styles.cardValue}>{profile.wins}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Losses</Text>
            <Text style={styles.cardValue}>{profile.losses}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Level</Text>
            <Text style={styles.cardValue}>{profile.level}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>XP to next</Text>
            <Text style={styles.cardValue}>{xpToNext}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Level {profile.level} progress</Text>
            <Text style={styles.progressMeta}>
              {xpInCurrentLevel} / {xpNeededForLevel} XP
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {winsToNext} {winsToNext === 1 ? 'win' : 'wins'} away from Level{' '}
            {profile.level + 1}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent matches</Text>
          <View style={styles.matchList}>
            <View style={styles.matchCard}>
              <View>
                <Text style={styles.matchTitle}>No matches logged yet</Text>
                <Text style={styles.matchSubtitle}>
                  Add your first match to get started.
                </Text>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>New</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.coral,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.muted,
    marginTop: 4,
  },
  rankPill: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  rankLabel: {
    color: '#d7e7ff',
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rankValue: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginTop: 8,
  },
  progressCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  progressMeta: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e7ecf4',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
  },
  progressHint: {
    marginTop: 10,
    color: colors.muted,
    fontSize: typography.sizes.sm,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  matchList: {
    gap: spacing.sm,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
  },
  matchSubtitle: {
    color: colors.muted,
    marginTop: 6,
  },
  matchBadge: {
    backgroundColor: '#eaf1ff',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
