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
import { watchColors } from '../../src/theme/colors';
import { watchSizing } from '../../src/theme/sizing';

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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={watchColors.primary} />}
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
    backgroundColor: watchColors.background,
  },
  container: {
    paddingHorizontal: watchSizing.pageHorizontal,
    paddingBottom: watchSizing.pageBottom,
    gap: watchSizing.pageGap,
  },
  pageTitle: {
    color: watchColors.text,
    fontSize: watchSizing.title,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  pageSubtitle: {
    color: watchColors.muted,
    fontSize: watchSizing.subtitle,
    textAlign: 'center',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 80,
  },
  mutedText: {
    color: watchColors.muted,
    fontSize: watchSizing.subtitle,
  },
  card: {
    borderWidth: 1,
    borderColor: watchColors.borderLight,
    borderRadius: watchSizing.cardRadius,
    backgroundColor: watchColors.cardBackground,
    padding: 8,
    gap: 4,
  },
  cardTitle: {
    color: watchColors.text,
    fontSize: watchSizing.body,
    fontWeight: '700',
  },
  cardMeta: {
    color: watchColors.muted,
    fontSize: watchSizing.label,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  actionBtn: {
    flex: 1,
    minHeight: watchSizing.buttonHeight,
    borderRadius: watchSizing.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: watchColors.success,
  },
  rejectBtn: {
    backgroundColor: watchColors.secondary,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: watchSizing.subtitle,
    fontWeight: '700',
  },
  actionDisabled: {
    opacity: 0.65,
  },
  errorText: {
    color: watchColors.secondary,
    fontSize: watchSizing.label,
    textAlign: 'center',
  },
});