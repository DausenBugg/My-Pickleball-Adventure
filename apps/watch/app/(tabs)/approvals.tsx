import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePendingMatches } from '../../src/hooks/usePendingMatches';

export default function ApprovalsScreen() {
  const { matches, loading, error, approveMatch, rejectMatch, refresh } = usePendingMatches();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const handleAction = async (matchId: string, action: 'approve' | 'reject') => {
    setPendingActionId(matchId);
    if (action === 'approve') {
      await approveMatch(matchId);
    } else {
      await rejectMatch(matchId);
    }
    setPendingActionId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#FFFFFF" />}
      >
        <Text style={styles.pageTitle}>Approvals</Text>
        <Text style={styles.pageSubtitle}>Pending matches need your vote.</Text>

        {loading && matches.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.mutedText}>Loading...</Text>
          </View>
        ) : null}

        {!loading && matches.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No pending matches.</Text>
          </View>
        ) : null}

        {matches.map((match) => {
          const running = pendingActionId === match.id;
          const teamA = match.participants.filter((p) => p.team === 'team_a').map((p) => p.full_name || 'Player');
          const teamB = match.participants.filter((p) => p.team === 'team_b').map((p) => p.full_name || 'Player');

          return (
            <View style={styles.card} key={match.id}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {match.match_type.toUpperCase()} • {match.match_mode.toUpperCase()}
              </Text>
              <Text style={styles.cardMeta}>
                {teamA.join(' + ')} vs {teamB.join(' + ')}
              </Text>
              <Text style={styles.cardMeta}>
                Score {match.team_a_score}-{match.team_b_score}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                Submitted by {match.submitter_name || 'Unknown'}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, styles.rejectBtn, running ? styles.actionDisabled : null]}
                  onPress={() => handleAction(match.id, 'reject')}
                  disabled={running}
                >
                  <Text style={styles.actionText}>Decline</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.approveBtn, running ? styles.actionDisabled : null]}
                  onPress={() => handleAction(match.id, 'approve')}
                  disabled={running}
                >
                  {running ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionText}>Approve</Text>}
                </Pressable>
              </View>
            </View>
          );
        })}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  container: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 10,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  pageSubtitle: {
    color: '#9DB0D5',
    fontSize: 12,
    textAlign: 'center',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 80,
  },
  mutedText: {
    color: '#9DB0D5',
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#24324A',
    borderRadius: 14,
    backgroundColor: '#121B2E',
    padding: 10,
    gap: 5,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#A9BCE1',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#2D9B5E',
  },
  rejectBtn: {
    backgroundColor: '#B54A60',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionDisabled: {
    opacity: 0.65,
  },
  errorText: {
    color: '#FF9AA2',
    fontSize: 11,
    textAlign: 'center',
  },
});