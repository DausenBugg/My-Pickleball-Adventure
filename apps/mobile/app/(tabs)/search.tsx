import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useFriends } from '../../src/hooks/useFriends';
import { Player, usePlayerSearch } from '../../src/hooks/usePlayerSearch';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import AnimatedPressable from '../../src/components/AnimatedPressable';

type Filter = 'all' | 'friends';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { colors } = useTheme();

  const { players, loading: searchLoading } = usePlayerSearch(query);
  const {
    friends,
    pendingSent,
    loading: friendsLoading,
    sendFriendRequest,
  } = useFriends();

  // Fetch friend profiles so friends tab works without a search query
  const [friendProfiles, setFriendProfiles] = useState<Player[]>([]);
  const [friendProfilesLoading, setFriendProfilesLoading] = useState(false);

  useEffect(() => {
    if (!supabase || friends.length === 0) {
      setFriendProfiles([]);
      return;
    }

    const fetchFriendProfiles = async () => {
      if (!supabase) return;
      setFriendProfilesLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, level, wins, losses, ratings(rating)')
        .in('id', friends)
        .order('full_name');

      const mapped: Player[] = (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        level: p.level,
        wins: p.wins,
        losses: p.losses,
        rating: p.ratings?.[0]?.rating ?? p.ratings?.rating ?? 1200,
      }));
      setFriendProfiles(mapped);
      setFriendProfilesLoading(false);
    };

    fetchFriendProfiles();
  }, [friends]);

  const results = useMemo(() => {
    if (filter === 'friends') {
      // If user typed a query, filter the friend profiles by query
      if (query.trim().length >= 2) {
        return players.filter((player) => friends.includes(player.id));
      }
      // Otherwise show all friend profiles
      return friendProfiles;
    }
    return players;
  }, [filter, players, friends, friendProfiles, query]);

  const loading = filter === 'friends'
    ? friendsLoading || friendProfilesLoading
    : searchLoading || friendsLoading;

  const handleAddFriend = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      console.log('Friend request sent');
    }
  };

  const getFriendStatus = (userId: string): 'friend' | 'pending' | 'none' => {
    if (friends.includes(userId)) return 'friend';
    if (pendingSent.includes(userId)) return 'pending';
    return 'none';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>Search players</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Find friends and view their progress.
          </Text>
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.searchBox, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={20} color={colors.muted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search by name or email"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.ink }]}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
          </View>
        </Animated.View>

        {/* Filter chips */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filters}>
          <AnimatedPressable
            style={[
              styles.filterChip,
              { backgroundColor: colors.borderLight },
              filter === 'all' ? { backgroundColor: colors.primary } : {},
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.muted },
                filter === 'all' ? { color: colors.textOnPrimary } : undefined,
              ]}
            >
              All players
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[
              styles.filterChip,
              { backgroundColor: colors.borderLight },
              filter === 'friends' ? { backgroundColor: colors.primary } : {},
            ]}
            onPress={() => setFilter('friends')}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.muted },
                filter === 'friends' ? { color: colors.textOnPrimary } : undefined,
              ]}
            >
              Friends
            </Text>
          </AnimatedPressable>
        </Animated.View>

        {loading && (query.length > 0 || filter === 'friends') ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Searching...</Text>
          </View>
        ) : null}

        <View style={styles.results}>
          {!loading && filter === 'all' && query.length < 2 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={44} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Enter at least 2 characters to search
              </Text>
            </View>
          ) : !loading && filter === 'friends' && results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={44} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {friends.length === 0 ? 'No friends yet. Add some!' : 'No friends match your search.'}
              </Text>
            </View>
          ) : !loading && results.length === 0 && query.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={44} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>No players found.</Text>
            </View>
          ) : (
            results.map((player, idx) => {
              const status = getFriendStatus(player.id);
              return (
                <Animated.View
                  key={player.id}
                  entering={FadeInDown.delay(200 + idx * 60).duration(400)}
                >
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={[styles.name, { color: colors.ink }]}>
                          {player.full_name || 'Player'}
                        </Text>
                        <Text style={[styles.meta, { color: colors.muted }]}>
                          Level {player.level}
                        </Text>
                      </View>
                      <View style={[styles.ratingPill, { backgroundColor: colors.primaryGhost }]}>
                        <Text style={[styles.ratingLabel, { color: colors.primary }]}>Rating</Text>
                        <Text style={[styles.ratingValue, { color: colors.primary }]}>{player.rating}</Text>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <Text style={[styles.stat, { color: colors.muted }]}>
                        Wins {player.wins}
                      </Text>
                      <Text style={[styles.stat, { color: colors.muted }]}>
                        Losses {player.losses}
                      </Text>
                    </View>

                    <AnimatedPressable
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.secondary },
                        status === 'friend' ? { backgroundColor: colors.borderLight } : {},
                        status === 'pending' ? { backgroundColor: colors.secondaryGhost } : {},
                      ]}
                      onPress={() =>
                        status === 'none' ? handleAddFriend(player.id) : null
                      }
                      disabled={status !== 'none'}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          status !== 'none' ? { color: colors.muted } : undefined,
                        ]}
                      >
                        {status === 'friend'
                          ? 'Friends'
                          : status === 'pending'
                            ? 'Pending'
                            : 'Add friend'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>

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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.base,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  filterText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.base,
  },
  results: {
    gap: 14,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  meta: {
    marginTop: 4,
  },
  ratingPill: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingValue: {
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    fontSize: typography.sizes.sm,
  },
  actionButton: {
    borderRadius: radii.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: typography.weights.semibold,
  },
});
