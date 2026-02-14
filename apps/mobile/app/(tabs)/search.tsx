import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useFriends } from '../../src/hooks/useFriends';
import { usePlayerSearch } from '../../src/hooks/usePlayerSearch';
import { AppScreen, EmptyState, GlassCard, GradientHeader, PrimaryButton, SegmentedControl } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';

type Filter = 'all' | 'friends';

export default function SearchScreen() {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const { players, loading: searchLoading } = usePlayerSearch(query);
  const { friends, pendingSent, loading: friendsLoading, sendFriendRequest } = useFriends();

  const results = useMemo(() => {
    if (filter === 'friends') return players.filter((player) => friends.includes(player.id));
    return players;
  }, [filter, players, friends]);

  const loading = searchLoading || friendsLoading;

  const handleAddFriend = async (userId: string) => {
    await sendFriendRequest(userId);
  };

  const getFriendStatus = (userId: string): 'friend' | 'pending' | 'none' => {
    if (friends.includes(userId)) return 'friend';
    if (pendingSent.includes(userId)) return 'pending';
    return 'none';
  };

  return (
    <AppScreen contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 120 }}>
      <GradientHeader title="Search Players" subtitle="Find friends, compare progress, and expand your network." />

      <GlassCard>
        <View
          style={{
            minHeight: 46,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.color.role.border,
            backgroundColor: theme.color.role.surfaceAlt,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search-outline" size={18} color={theme.color.role.textMuted} />
          <TextInput
            placeholder="Search by name or email"
            placeholderTextColor={theme.color.role.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            style={{
              flex: 1,
              color: theme.color.role.textPrimary,
              fontFamily: theme.type.family.body,
              fontSize: theme.type.sizes.base,
            }}
          />
        </View>
      </GlassCard>

      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All players' },
          { value: 'friends', label: 'Friends' },
        ]}
      />

      {loading && query.length > 0 ? (
        <GlassCard style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <ActivityIndicator size="large" color={theme.color.role.primary} />
          <Text
            style={{
              marginTop: theme.spacing.sm,
              color: theme.color.role.textMuted,
              fontFamily: theme.type.family.body,
            }}
          >
            Searching...
          </Text>
        </GlassCard>
      ) : null}

      {!loading && query.length < 2 ? (
        <EmptyState
          title="Start typing to search"
          subtitle="Enter at least 2 characters to discover players."
          icon="search-outline"
        />
      ) : null}

      {!loading && query.length >= 2 && results.length === 0 ? (
        <EmptyState title="No players found" subtitle="Try a different name or email." icon="person-outline" />
      ) : null}

      {!loading &&
        results.map((player) => {
          const status = getFriendStatus(player.id);
          return (
            <GlassCard key={player.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.md }}>
                    {player.full_name || 'Player'}
                  </Text>
                  <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, marginTop: 3 }}>
                    Level {player.level}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.color.role.primarySoft,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                  }}
                >
                  <Text style={{ color: theme.color.role.primary, fontFamily: theme.type.family.bodySemi, fontSize: theme.type.sizes.xs }}>
                    Rating 1200
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: theme.spacing.sm, flexDirection: 'row', gap: theme.spacing.md }}>
                <Text style={{ color: theme.color.role.textSecondary, fontFamily: theme.type.family.body }}>
                  Wins {player.wins}
                </Text>
                <Text style={{ color: theme.color.role.textSecondary, fontFamily: theme.type.family.body }}>
                  Losses {player.losses}
                </Text>
              </View>

              {status === 'none' ? (
                <PrimaryButton label="Add friend" onPress={() => handleAddFriend(player.id)} style={{ marginTop: theme.spacing.sm }} />
              ) : (
                <Pressable
                  style={{
                    marginTop: theme.spacing.sm,
                    minHeight: 44,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: theme.color.role.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.color.role.surfaceAlt,
                  }}
                >
                  <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }}>
                    {status === 'friend' ? 'Friends' : 'Pending'}
                  </Text>
                </Pressable>
              )}
            </GlassCard>
          );
        })}
    </AppScreen>
  );
}
