import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AdBanner from '../../src/components/AdBanner';
import { AD_UNIT_IDS } from '../../src/lib/adUnitIds';
import { useLeaderboard } from '../../src/hooks/useLeaderboard';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import AnimatedPressable from '../../src/components/AnimatedPressable';
import { LeagueRatingBadge, LeagueInlineBadge } from '../../src/components/LeagueBadge';

type BoardType = 'global' | 'friends';

const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']; // gold, silver, bronze

export default function LeaderboardScreen() {
  const [boardType, setBoardType] = useState<BoardType>('global');
  const { entries, loading } = useLeaderboard(boardType);
  const { colors } = useTheme();

  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);

  const Avatar = ({ url, name, size = 48, borderColor }: { url: string | null; name: string; size?: number; borderColor?: string }) => {
    const style = {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: borderColor ? 3 : 0,
      borderColor: borderColor || 'transparent',
    };
    if (url) {
      return <Image source={{ uri: url }} style={[styles.avatar, style]} />;
    }
    return (
      <View style={[styles.avatarPlaceholder, style, { backgroundColor: colors.primary }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{name[0]?.toUpperCase() || 'P'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>Leaderboard</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Top players by ranking points.</Text>
        </Animated.View>

        {/* Ad banner */}
        <AdBanner adUnitId={AD_UNIT_IDS.LEADERBOARD_BANNER} />

        {/* Segment control */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.segment, { backgroundColor: colors.borderLight }]}>
            <AnimatedPressable
              style={[
                styles.segmentButton,
                boardType === 'global' ? { backgroundColor: colors.primary } : {},
              ]}
              onPress={() => setBoardType('global')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.muted },
                  boardType === 'global' && { color: colors.textOnPrimary },
                ]}
              >
                Global
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                styles.segmentButton,
                boardType === 'friends' ? { backgroundColor: colors.primary } : {},
              ]}
              onPress={() => setBoardType('friends')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.muted },
                  boardType === 'friends' && { color: colors.textOnPrimary },
                ]}
              >
                Friends
              </Text>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading rankings...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {boardType === 'friends'
                ? 'No friends on the leaderboard yet'
                : 'No players ranked yet'}
            </Text>
          </View>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.podiumRow}>
                {podium.map((player, index) => (
                  <AnimatedPressable
                    key={player.id}
                    style={[
                      styles.podiumCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: MEDAL_COLORS[index] || colors.borderLight,
                        borderWidth: index === 0 ? 2.5 : 1.5,
                      },
                      index === 0 ? styles.podiumTop : {},
                    ]}
                  >
                    <Text style={[styles.podiumRank, { color: MEDAL_COLORS[index] || colors.primary }]}>
                      #{index + 1}
                    </Text>
                    <Avatar
                      url={player.avatar_url}
                      name={player.full_name || 'Player'}
                      size={index === 0 ? 56 : 48}
                      borderColor={MEDAL_COLORS[index]}
                    />
                    <Text style={[styles.podiumName, { color: colors.ink }]} numberOfLines={2}>
                      {player.full_name || 'Player'}
                    </Text>
                    <LeagueRatingBadge rating={player.rating} rank={index + 1} />
                    <Text style={[styles.podiumMeta, { color: colors.muted }]}>
                      {player.wins}W · {player.losses}L
                    </Text>
                  </AnimatedPressable>
                ))}
              </Animated.View>
            )}

            {/* Remaining list */}
            {rest.length > 0 && (
              <View style={styles.list}>
                {rest.map((player, index) => (
                  <Animated.View
                    key={player.id}
                    entering={FadeInDown.delay(300 + index * 50).duration(400)}
                  >
                    <AnimatedPressable
                      style={[
                        styles.listItem,
                        { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                      ]}
                    >
                      <Text style={[styles.listRank, { color: colors.primary }]}>#{index + 4}</Text>
                      <Avatar url={player.avatar_url} name={player.full_name || 'Player'} size={40} />
                      <View style={styles.listInfo}>
                        <Text style={[styles.listName, { color: colors.ink }]} numberOfLines={1}>
                          {player.full_name || 'Player'}
                        </Text>
                        <Text style={[styles.listMeta, { color: colors.muted }]}>
                          Level {player.level} · {player.wins}W · {player.losses}L
                        </Text>
                      </View>
                      <LeagueInlineBadge rating={player.rating} rank={index + 4} ratingColor={colors.ink} />
                    </AnimatedPressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  subtitle: {},
  segment: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  segmentText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.base,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl * 2,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  podiumRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  podiumCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  podiumTop: {
    marginTop: -8,
    paddingTop: spacing.lg,
  },
  podiumRank: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    marginBottom: 6,
  },
  avatar: {
    marginBottom: 8,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  podiumName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: 6,
  },
  podiumRatingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  podiumRatingText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  podiumMeta: {
    fontSize: typography.sizes.xs,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  listItem: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  listRank: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    width: 40,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  listMeta: {
    fontSize: typography.sizes.sm,
  },
  listRating: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
