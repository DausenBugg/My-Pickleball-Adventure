import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PendingMatch, usePendingMatches } from '../src/hooks/usePendingMatches';
import { useAuth } from '../src/state/auth';
import { colors, radii, spacing, typography } from '../src/theme';

function MatchCard({
  match,
  onApprove,
  onReject,
}: {
  match: PendingMatch;
  onApprove: () => Promise<boolean>;
  onReject: () => Promise<boolean>;
}) {
  const { session } = useAuth();
  const [processing, setProcessing] = useState(false);

  const userParticipant = match.participants.find(
    (p: any) => p.user_id === session?.user?.id
  );
  const userTeam = userParticipant?.team;
  const isWinner = userTeam === match.winner_team;

  const teamAPlayers = match.participants.filter((p: any) => p.team === 'team_a');
  const teamBPlayers = match.participants.filter((p: any) => p.team === 'team_b');

  const hasApproved = match.approvals.some(
    (a: any) => a.user_id === session?.user?.id && a.approved
  );
  const hasRejected = match.approvals.some(
    (a: any) => a.user_id === session?.user?.id && !a.approved
  );

  const approvalCount = match.approvals.filter((a: any) => a.approved).length;
  const requiredApprovals = match.match_type === 'singles' ? 2 : 3;

  const handleApprove = async () => {
    setProcessing(true);
    const success = await onApprove();
    setProcessing(false);
    if (success) {
      Alert.alert('Match approved', 'Your approval has been recorded.');
    } else {
      Alert.alert('Error', 'Failed to approve match. Please try again.');
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject match?',
      'Are you sure you want to reject this match? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            const success = await onReject();
            setProcessing(false);
            if (success) {
              Alert.alert('Match rejected', 'Match has been rejected.');
            } else {
              Alert.alert('Error', 'Failed to reject match. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View>
          <Text style={styles.matchType}>
            {match.match_type === 'singles' ? 'Singles' : 'Doubles'} •{' '}
            {match.match_mode === 'casual' ? 'Casual' : 'Ranked'}
          </Text>
          <Text style={styles.matchSubmitter}>
            Submitted by {match.submitter_name || 'Unknown'}
          </Text>
        </View>
        <View style={[styles.resultBadge, isWinner ? styles.winBadge : styles.lossBadge]}>
          <Text style={styles.resultText}>{isWinner ? 'Win' : 'Loss'}</Text>
        </View>
      </View>

      <View style={styles.teamsContainer}>
        <View style={styles.team}>
          <Text style={styles.teamLabel}>Team A</Text>
          {teamAPlayers.map((p: any) => (
            <Text key={p.user_id} style={styles.playerName}>
              {p.full_name || 'Player'}
              {p.user_id === session?.user?.id ? ' (You)' : ''}
            </Text>
          ))}
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>
            {match.team_a_score} - {match.team_b_score}
          </Text>
        </View>
        <View style={styles.team}>
          <Text style={styles.teamLabel}>Team B</Text>
          {teamBPlayers.map((p: any) => (
            <Text key={p.user_id} style={styles.playerName}>
              {p.full_name || 'Player'}
              {p.user_id === session?.user?.id ? ' (You)' : ''}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.approvalStatus}>
        <Text style={styles.approvalText}>
          Approvals: {approvalCount} / {requiredApprovals}
        </Text>
      </View>

      {hasApproved ? (
        <View style={styles.approvedBanner}>
          <Text style={styles.approvedText}>✓ You approved this match</Text>
        </View>
      ) : hasRejected ? (
        <View style={styles.rejectedBanner}>
          <Text style={styles.rejectedText}>✗ You rejected this match</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={colors.coral} />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.approveButton]}
            onPress={handleApprove}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.approveButtonText}>Approve</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ApprovalsScreen() {
  const { matches, loading, approveMatch, rejectMatch, refresh } = usePendingMatches();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.blue]} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Pending Approvals</Text>
          <Text style={styles.subtitle}>
            Review and approve matches you participated in.
          </Text>
        </View>

        {loading && matches.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.loadingText}>Loading matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pending approvals</Text>
            <Text style={styles.emptyHint}>
              Matches you participate in will appear here for approval.
            </Text>
          </View>
        ) : (
          <View style={styles.matches}>
            {matches.map((match: any) => (
              <MatchCard
                key={match.id}
                match={match}
                onApprove={async () => await approveMatch(match.id)}
                onReject={async () => await rejectMatch(match.id)}
              />
            ))}
          </View>
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
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.muted,
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
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  matches: {
    gap: spacing.md,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchType: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.ink,
    marginBottom: 2,
  },
  matchSubmitter: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  resultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: radii.pill,
  },
  winBadge: {
    backgroundColor: '#e8f5e9',
  },
  lossBadge: {
    backgroundColor: '#ffebee',
  },
  resultText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  team: {
    flex: 1,
  },
  teamLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  playerName: {
    fontSize: typography.sizes.sm,
    color: colors.ink,
    marginBottom: 2,
  },
  scoreContainer: {
    paddingHorizontal: spacing.sm,
  },
  score: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.ink,
  },
  approvalStatus: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#f5f7fa',
    borderRadius: radii.sm,
  },
  approvalText: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  rejectButton: {
    backgroundColor: '#fff2f0',
    borderWidth: 1,
    borderColor: '#ffd6d1',
  },
  rejectButtonText: {
    color: colors.coral,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  approveButton: {
    backgroundColor: colors.blue,
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  approvedBanner: {
    backgroundColor: '#e8f5e9',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  approvedText: {
    color: '#2e7d32',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  rejectedBanner: {
    backgroundColor: '#ffebee',
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  rejectedText: {
    color: '#c62828',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});

