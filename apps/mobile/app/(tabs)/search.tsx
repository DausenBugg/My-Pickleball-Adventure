import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  {
    id: '1',
    name: 'Avery Johnson',
    level: 12,
    rating: 1480,
    wins: 34,
    losses: 18,
    status: 'friend',
  },
  {
    id: '2',
    name: 'Blake Carter',
    level: 7,
    rating: 1320,
    wins: 21,
    losses: 14,
    status: 'none',
  },
  {
    id: '3',
    name: 'Casey Morgan',
    level: 18,
    rating: 1585,
    wins: 49,
    losses: 22,
    status: 'pending',
  },
  {
    id: '4',
    name: 'Drew Sanchez',
    level: 4,
    rating: 1210,
    wins: 9,
    losses: 11,
    status: 'none',
  },
  {
    id: '5',
    name: 'Emery Patel',
    level: 15,
    rating: 1512,
    wins: 41,
    losses: 19,
    status: 'friend',
  },
];

type Filter = 'all' | 'friends';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return mockPlayers.filter((player) => {
      const matchesQuery = normalizedQuery.length === 0
        ? true
        : player.name.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filter === 'friends'
        ? player.status === 'friend'
        : true;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

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
            placeholder="Search by name"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
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

        <View style={styles.results}>
          {results.length === 0 ? (
            <Text style={styles.emptyText}>No players found.</Text>
          ) : (
            results.map((player) => (
              <View key={player.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.name}>{player.name}</Text>
                    <Text style={styles.meta}>Level {player.level}</Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <Text style={styles.ratingLabel}>Rating</Text>
                    <Text style={styles.ratingValue}>{player.rating}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <Text style={styles.stat}>Wins {player.wins}</Text>
                  <Text style={styles.stat}>Losses {player.losses}</Text>
                </View>

                <Pressable
                  style={[
                    styles.actionButton,
                    player.status === 'friend' && styles.actionMuted,
                    player.status === 'pending' && styles.actionPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      player.status !== 'none' && styles.actionTextMuted,
                    ]}
                  >
                    {player.status === 'friend'
                      ? 'Friends'
                      : player.status === 'pending'
                        ? 'Pending'
                        : 'Add friend'}
                  </Text>
                </Pressable>
              </View>
            ))
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
  searchBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  input: {
    height: 48,
    color: colors.ink,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eef2f7',
  },
  filterActive: {
    backgroundColor: colors.blue,
  },
  filterText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  results: {
    gap: 14,
  },
  emptyText: {
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
  },
  ratingPill: {
    backgroundColor: '#eaf1ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  ratingLabel: {
    color: colors.blue,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingValue: {
    color: colors.blue,
    fontWeight: '700',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    color: colors.muted,
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: colors.coral,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionMuted: {
    backgroundColor: '#eff2f7',
  },
  actionPending: {
    backgroundColor: '#ffe9e6',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionTextMuted: {
    color: colors.muted,
  },
});
