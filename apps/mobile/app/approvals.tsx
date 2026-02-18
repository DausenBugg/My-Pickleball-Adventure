import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PendingMatch, usePendingMatches } from '../src/hooks/usePendingMatches';
import { useAuth } from '../src/state/auth';
import { useTheme } from '../src/theme';
import { radii, shadows, spacing, typography } from '../src/theme/tokens';
import AnimatedPressable from '../src/components/AnimatedPressable';

function MatchCard({
  match,
  onApprove,
  onReject,
  colors,
}: {
  match: PendingMatch;
  onApprove: () => Promise<boolean>;
  onReject: () => Promise<boolean>;
  colors: ReturnType<typeof useTheme>['colors'];
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
    <View style={[styles.matchCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <View style={styles.matchHeader}>
        <View>
          <Text style={[styles.matchType, { color: colors.ink }]}>
            {match.match_type === 'singles' ? 'Singles' : 'Doubles'} •{' '}
            {match.match_mode === 'casual' ? 'Casual' : 'Ranked'}
          </Text>
          <Text style={[styles.matchSubmitter, { color: colors.muted }]}>
            Submitted by {match.submitter_name || 'Unknown'}
          </Text>
        </View>
        <View style={[styles.resultBadge, { backgroundColor: isWinner ? colors.successGhost : colors.secondaryGhost }]}>
          <Text style={[styles.resultText, { color: isWinner ? colors.success : colors.secondary }]}>{isWinner ? 'Win' : 'Loss'}</Text>
        </View>
      </View>

      <View style={styles.teamsContainer}>
        <View style={styles.team}>
          <Text style={[styles.teamLabel, { color: colors.muted }]}>Team A</Text>
          {teamAPlayers.map((p: any) => (
            <Text key={p.user_id} style={[styles.playerName, { color: colors.ink }]}>
              {p.full_name || 'Player'}
              {p.user_id === session?.user?.id ? ' (You)' : ''}
            </Text>
          ))}
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.ink }]}>
            {match.team_a_score} - {match.team_b_score}
          </Text>
        </View>
        <View style={styles.team}>
          <Text style={[styles.teamLabel, { color: colors.muted }]}>Team B</Text>
          {teamBPlayers.map((p: any) => (
            <Text key={p.user_id} style={[styles.playerName, { color: colors.ink }]}>
              {p.full_name || 'Player'}
              {p.user_id === session?.user?.id ? ' (You)' : ''}
            </Text>
          ))}
        </View>
      </View>

      <View style={[styles.approvalStatus, { backgroundColor: colors.primaryGhost }]}>
        <Text style={[styles.approvalText, { color: colors.primary }]}>
          Approvals: {approvalCount} / {requiredApprovals}
        </Text>
      </View>

      {hasApproved ? (
        <View style={[styles.approvedBanner, { backgroundColor: colors.successGhost }]}>
          <Text style={[styles.approvedText, { color: colors.success }]}>✓ You approved this match</Text>
        </View>
      ) : hasRejected ? (
        <View style={[styles.rejectedBanner, { backgroundColor: colors.secondaryGhost }]}>
          <Text style={[styles.rejectedText, { color: colors.secondary }]}>✗ You rejected this match</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <AnimatedPressable
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.secondaryGhost, borderColor: colors.secondary }]}
            onPress={handleReject}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <Text style={[styles.rejectButtonText, { color: colors.secondary }]}>Reject</Text>
            )}
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.primary }]}
            onPress={handleApprove}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.approveButtonText}>Approve</Text>
            )}
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

export default function ApprovalsScreen() {
  const { matches, loading, approveMatch, rejectMatch, refresh } = usePendingMatches();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>Pending Approvals</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Review and approve matches you participated in.
          </Text>
        </Animated.View>

        {loading && matches.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.ink }]}>No pending approvals</Text>
            <Text style={[styles.emptyHint, { color: colors.muted }]}>
              Matches you participate in will appear here for approval.
            </Text>
          </View>
        ) : (
          <View style={styles.matches}>
            {matches.map((match: any, idx: number) => (
              <Animated.View key={match.id} entering={FadeInDown.delay(100 + idx * 60).duration(400)}>
                <MatchCard
                  match={match}
                  onApprove={async () => await approveMatch(match.id)}
                  onReject={async () => await rejectMatch(match.id)}
                  colors={colors}
                />
              </Animated.View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.sizes.base,
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.base,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  matches: {
    gap: spacing.md,
  },
  matchCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
    ...shadows.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchType: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  matchSubmitter: {
    fontSize: typography.sizes.sm,
  },
  resultBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: radii.pill,
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
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  playerName: {
    fontSize: typography.sizes.sm,
    marginBottom: 2,
  },
  scoreContainer: {
    paddingHorizontal: spacing.sm,
  },
  score: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  approvalStatus: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
  },
  approvalText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  rejectButton: {
    borderWidth: 1,
  },
  rejectButtonText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  approveButton: {},
  approveButtonText: {
    color: '#ffffff',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  approvedBanner: {
    padding: spacing.sm,
    borderRadius: radii.lg,
  },
  approvedText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  rejectedBanner: {
    padding: spacing.sm,
    borderRadius: radii.lg,
  },
  rejectedText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});

