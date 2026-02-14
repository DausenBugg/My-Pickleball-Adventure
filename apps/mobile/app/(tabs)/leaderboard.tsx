import { useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useLeaderboard } from '../../src/hooks/useLeaderboard';
import { AppScreen, Avatar, EmptyState, GlassCard, GradientHeader, SegmentedControl } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';

type BoardType = 'global' | 'friends';

export default function LeaderboardScreen() {
  const { theme } = useAppTheme();
  const [boardType, setBoardType] = useState<BoardType>('global');
  const { entries, loading } = useLeaderboard(boardType);

  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const rest = useMemo(() => entries.slice(3), [entries]);

  return (
    <AppScreen contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 120 }}>
      <GradientHeader title="Leaderboard" subtitle="Top players ranked by rating points." />

      <SegmentedControl
        value={boardType}
        onChange={setBoardType}
        options={[
          { value: 'global', label: 'Global' },
          { value: 'friends', label: 'Friends' },
        ]}
      />

      {loading ? (
        <GlassCard style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <ActivityIndicator size="large" color={theme.color.role.primary} />
          <Text style={{ marginTop: theme.spacing.sm, color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
            Loading rankings...
          </Text>
        </GlassCard>
      ) : entries.length === 0 ? (
        <EmptyState
          title={boardType === 'friends' ? 'No friends ranked yet' : 'No ranked players yet'}
          subtitle="Play ranked matches to populate this board."
          icon="trophy-outline"
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {podium.map((player, index) => (
              <GlassCard
                key={player.id}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderColor: index === 0 ? theme.color.role.secondary : theme.color.role.border,
                  borderWidth: index === 0 ? 2 : 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons
                    name={index === 0 ? 'trophy' : 'medal-outline'}
                    size={16}
                    color={index === 0 ? theme.color.role.secondary : theme.color.role.primary}
                  />
                  <Text style={{ color: theme.color.role.textSecondary, fontFamily: theme.type.family.bodySemi }}>#{index + 1}</Text>
                </View>
                <View style={{ marginVertical: theme.spacing.sm }}>
                  <Avatar uri={player.avatar_url} name={player.full_name || 'Player'} />
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    textAlign: 'center',
                    color: theme.color.role.textPrimary,
                    fontFamily: theme.type.family.bodySemi,
                    fontSize: theme.type.sizes.sm,
                  }}
                >
                  {player.full_name || 'Player'}
                </Text>
                <Text style={{ marginTop: 4, color: theme.color.role.primary, fontFamily: theme.type.family.headingSemi }}>
                  {player.rating}
                </Text>
              </GlassCard>
            ))}
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            {rest.map((player, index) => (
              <GlassCard key={player.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <Text
                    style={{
                      width: 34,
                      color: theme.color.role.primary,
                      fontFamily: theme.type.family.headingSemi,
                      fontSize: theme.type.sizes.md,
                    }}
                  >
                    #{index + 4}
                  </Text>
                  <Avatar uri={player.avatar_url} name={player.full_name || 'Player'} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>
                      {player.full_name || 'Player'}
                    </Text>
                    <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
                      Level {player.level} | Wins {player.wins}
                    </Text>
                  </View>
                  <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>
                    {player.rating}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </>
      )}
    </AppScreen>
  );
}
