import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFriends } from '../../src/hooks/useFriends';
import { usePlayerSearch } from '../../src/hooks/usePlayerSearch';
import { colors, radii, spacing, typography } from '../../src/theme';

type Filter = 'all' | 'friends';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const { players,  loading: searchLoading } = usePlayerSearch(query);
  const {
    friends,
    pendingSent,
    loading: friendsLoading,
    sendFriendRequest,
  } = useFriends();

  const results = useMemo(() => {
    if (filter === 'friends') {
      // Only show friends
      return players.filter((player) => friends.includes(player.id));
    }
    return players;
  }, [filter, players, friends]);

  const loading = searchLoading || friendsLoading;

  const handleAddFriend = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      // Optionally show a success message
      console.log('Friend request sent');
    }
  };

  const getFriendStatus = (userId: string): 'friend' | 'pending' | 'none' => {
    if (friends.includes(userId)) return 'friend';
    if (pendingSent.includes(userId)) return 'pending';
    return 'none';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Search players</Text>
          <Text style={styles.subtitle}>
            Find friends and view their progress.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search by name or email"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.filters}>
          <Pressable
            style={[styles.filterChip, filter === 'all' && styles.filterActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              All players
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterChip,
              filter === 'friends' && styles.filterActive,
            ]}
            onPress={() => setFilter('friends')}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'friends' && styles.filterTextActive,
              ]}
            >
              Friends
            </Text>
          </Pressable>
        </View>

        {loading && query.length > 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : null}

        <View style={styles.results}>
          {!loading && query.length < 2 ? (
            <Text style={styles.emptyText}>
              Enter at least 2 characters to search
            </Text>
          ) : !loading && results.length === 0 && query.length >= 2 ? (
            <Text style={styles.emptyText}>No players found.</Text>
          ) : (
            results.map((player) => {
              const status = getFriendStatus(player.id);
              return (
                <View key={player.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.name}>
                        {player.full_name || 'Player'}
                      </Text>
                      <Text style={styles.meta}>Level {player.level}</Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingLabel}>Rating</Text>
                      <Text style={styles.ratingValue}>1200</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <Text style={styles.stat}>Wins {player.wins}</Text>
                    <Text style={styles.stat}>Losses {player.losses}</Text>
                  </View>

                  <Pressable
                    style={[
                      styles.actionButton,
                      status === 'friend' && styles.actionMuted,
                      status === 'pending' && styles.actionPending,
                    ]}
                    onPress={() =>
                      status === 'none' ? handleAddFriend(player.id) : null
                    }
                    disabled={status !== 'none'}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        status !== 'none' && styles.actionTextMuted,
                      ]}
                    >
                      {status === 'friend'
                        ? 'Friends'
                        : status === 'pending'
                          ? 'Pending'
                          : 'Add friend'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
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
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.families.bold,
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.families.regular,
  },
  searchBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  input: {
    height: 48,
    color: colors.ink,
    fontSize: typography.sizes.base,
    fontFamily: typography.families.regular,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
  },
  filterActive: {
    backgroundColor: colors.blue,
  },
  filterText: {
    color: colors.muted,
    fontFamily: typography.families.semibold,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.6,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.sizes.base,
    fontFamily: typography.families.regular,
  },
  results: {
    gap: 14,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontFamily: typography.families.medium,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.sizes.md,
    fontFamily: typography.families.bold,
    color: colors.ink,
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
    fontFamily: typography.families.regular,
  },
  ratingPill: {
    backgroundColor: colors.blueSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  ratingLabel: {
    color: colors.blueDark,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.6,
    fontFamily: typography.families.semibold,
  },
  ratingValue: {
    color: colors.blueDark,
    fontFamily: typography.families.bold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.medium,
  },
  actionButton: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionMuted: {
    backgroundColor: colors.blueSoft,
  },
  actionPending: {
    backgroundColor: colors.coralSoft,
  },
  actionText: {
    color: '#ffffff',
    fontFamily: typography.families.semibold,
  },
  actionTextMuted: {
    color: colors.muted,
  },
});
