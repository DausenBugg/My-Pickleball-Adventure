import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  ink: '#0b1a2b',
  muted: '#5a6a7d',
  blue: '#2b6cb0',
  coral: '#ff6b5a',
  surface: '#ffffff',
  background: '#f7f8fb',
  border: '#e0e4ec',
};

const mockPlayers = [
  { id: '1', name: 'Avery Johnson', rating: 1680, level: 19, wins: 62 },
  { id: '2', name: 'Emery Patel', rating: 1642, level: 17, wins: 58 },
  { id: '3', name: 'Casey Morgan', rating: 1601, level: 16, wins: 54 },
  { id: '4', name: 'Jordan Lee', rating: 1555, level: 14, wins: 48 },
  { id: '5', name: 'Blake Carter', rating: 1522, level: 13, wins: 44 },
  { id: '6', name: 'Drew Sanchez', rating: 1490, level: 11, wins: 39 },
  { id: '7', name: 'Kai Howard', rating: 1458, level: 10, wins: 34 },
  { id: '8', name: 'Riley Brooks', rating: 1432, level: 9, wins: 30 },
];

type BoardType = 'global' | 'friends';

export default function LeaderboardScreen() {
  const [boardType, setBoardType] = useState<BoardType>('global');

  const players = useMemo(() => {
    if (boardType === 'friends') {
      return mockPlayers.slice(2, 8);
    }
    return mockPlayers;
  }, [boardType]);

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.subtitle}>
            Top players by ranking points.
          </Text>
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

        <View style={styles.podiumRow}>
          {podium.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.podiumCard,
                index === 0 && styles.podiumTop,
              ]}
            >
              <Text style={styles.podiumRank}>#{index + 1}</Text>
              <Text style={styles.podiumName}>{player.name}</Text>
              <Text style={styles.podiumMeta}>Rating {player.rating}</Text>
            </View>
          ))}
        </View>

        <View style={styles.list}>
          {rest.map((player, index) => (
            <View key={player.id} style={styles.listItem}>
              <Text style={styles.listRank}>#{index + 4}</Text>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{player.name}</Text>
                <Text style={styles.listMeta}>
                  Level {player.level} · Wins {player.wins}
                </Text>
              </View>
              <Text style={styles.listRating}>{player.rating}</Text>
            </View>
          ))}
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
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#eef2f7',
    borderRadius: 16,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
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
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.ink,
  },
  podiumRow: {
    flexDirection: 'row',
    gap: 10,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  podiumTop: {
    borderColor: colors.coral,
  },
  podiumRank: {
    color: colors.coral,
    fontWeight: '700',
  },
  podiumName: {
    color: colors.ink,
    fontWeight: '600',
    textAlign: 'center',
  },
  podiumMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listRank: {
    width: 36,
    color: colors.muted,
    fontWeight: '600',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    color: colors.ink,
    fontWeight: '600',
  },
  listMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  listRating: {
    color: colors.blue,
    fontWeight: '700',
  },
});
