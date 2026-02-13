import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLeaderboard } from '../../src/hooks/useLeaderboard';
import { colors, radii, spacing, typography } from '../../src/theme';

type BoardType = 'global' | 'friends';

export default function LeaderboardScreen() {
  const [boardType, setBoardType] = useState<BoardType>('global');
  const { entries, loading } = useLeaderboard(boardType);

  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);

  const Avatar = ({ url, name }: { url: string | null; name: string }) => {
    if (url) {
      return <Image source={{ uri: url }} style={styles.avatar} />;
    }
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{name[0]?.toUpperCase() || 'P'}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>Top players by ranking points.</Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            style={[
              styles.segmentButton,
              boardType === 'global' && styles.segmentActive,
            ]}
            onPress={() => setBoardType('global')}
          >
            <Text
              style={[
                styles.segmentText,
                boardType === 'global' && styles.segmentTextActive,
              ]}
            >
              Global
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentButton,
              boardType === 'friends' && styles.segmentActive,
            ]}
            onPress={() => setBoardType('friends')}
          >
            <Text
              style={[
                styles.segmentText,
                boardType === 'friends' && styles.segmentTextActive,
              ]}
            >
              Friends
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.loadingText}>Loading rankings...</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {boardType === 'friends'
                ? 'No friends on the leaderboard yet'
                : 'No players ranked yet'}
            </Text>
          </View>
        ) : (
          <>
            {podium.length > 0 ? (
              <View style={styles.podiumRow}>
                {podium.map((player, index) => (
                  <View
                    key={player.id}
                    style={[styles.podiumCard, index === 0 && styles.podiumTop]}
                  >
                    <Text style={styles.podiumRank}>#{index + 1}</Text>
                    <Avatar url={player.avatar_url} name={player.full_name || 'Player'} />
                    <Text style={styles.podiumName} numberOfLines={2}>
                      {player.full_name || 'Player'}
                    </Text>
                    <Text style={styles.podiumMeta}>
                      Rating {player.rating}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {rest.length > 0 ? (
              <View style={styles.list}>
                {rest.map((player, index) => (
                  <View key={player.id} style={styles.listItem}>
                    <Text style={styles.listRank}>#{index + 4}</Text>
                    <Avatar url={player.avatar_url} name={player.full_name || 'Player'} />
                    <View style={styles.listInfo}>
                      <Text style={styles.listName} numberOfLines={1}>
                        {player.full_name || 'Player'}
                      </Text>
                      <Text style={styles.listMeta}>
                        Level {player.level} · Wins {player.wins}
                      </Text>
                    </View>
                    <Text style={styles.listRating}>{player.rating}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
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
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#eef2f7',
    borderRadius: radii.lg,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: typography.weights.semibold,
  },
  segmentTextActive: {
    color: colors.ink,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.sizes.base,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  podiumTop: {
    borderColor: '#ffd700',
    borderWidth: 2,
    backgroundColor: '#fffef7',
  },
  podiumRank: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.blue,
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  podiumName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumMeta: {
    fontSize: typography.sizes.xs,
    color: colors.muted,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  listRank: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.blue,
    width: 40,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: 2,
  },
  listMeta: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  listRating: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
});
