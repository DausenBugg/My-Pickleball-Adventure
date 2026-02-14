import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { PendingMatch, usePendingMatches } from '../src/hooks/usePendingMatches';
import { useAuth } from '../src/state/auth';
import { AppScreen, EmptyState, GlassCard, GradientHeader, PrimaryButton } from '../src/components/ui';
import { useAppTheme } from '../src/theme';

function MatchCard({
  match,
  onApprove,
  onReject,
}: {
  match: PendingMatch;
  onApprove: () => Promise<boolean>;
  onReject: () => Promise<boolean>;
}) {
  const { theme } = useAppTheme();
  const { session } = useAuth();
  const [processing, setProcessing] = useState(false);

  const userParticipant = match.participants.find((p) => p.user_id === session?.user?.id);
  const userTeam = userParticipant?.team;
  const isWinner = userTeam === match.winner_team;

  const teamAPlayers = match.participants.filter((p) => p.team === 'team_a');
  const teamBPlayers = match.participants.filter((p) => p.team === 'team_b');

  const hasApproved = match.approvals.some((a) => a.user_id === session?.user?.id && a.approved);
  const hasRejected = match.approvals.some((a) => a.user_id === session?.user?.id && !a.approved);

  const approvalCount = match.approvals.filter((a) => a.approved).length;
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
    Alert.alert('Reject match?', 'Are you sure you want to reject this match? This cannot be undone.', [
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
    ]);
  };

  return (
    <GlassCard style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.base }}>
            {match.match_type === 'singles' ? 'Singles' : 'Doubles'} | {match.match_mode === 'casual' ? 'Casual' : 'Ranked'}
          </Text>
          <Text style={{ marginTop: 2, color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
            Submitted by {match.submitter_name || 'Unknown'}
          </Text>
        </View>
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: isWinner ? theme.color.role.successSoft : theme.color.role.secondarySoft,
          }}
        >
          <Text
            style={{
              color: isWinner ? theme.color.role.success : theme.color.role.secondary,
              fontFamily: theme.type.family.bodySemi,
              fontSize: theme.type.sizes.sm,
            }}
          >
            {isWinner ? 'Win' : 'Loss'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi, fontSize: theme.type.sizes.xs }}>
            TEAM A
          </Text>
          {teamAPlayers.map((p) => (
            <Text key={p.user_id} style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.body }}>
              {p.full_name || 'Player'}{p.user_id === session?.user?.id ? ' (You)' : ''}
            </Text>
          ))}
        </View>
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi, fontSize: theme.type.sizes.lg }}>
          {match.team_a_score} - {match.team_b_score}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi, fontSize: theme.type.sizes.xs }}>
            TEAM B
          </Text>
          {teamBPlayers.map((p) => (
            <Text key={p.user_id} style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.body }}>
              {p.full_name || 'Player'}{p.user_id === session?.user?.id ? ' (You)' : ''}
            </Text>
          ))}
        </View>
      </View>

      <View
        style={{
          borderRadius: theme.radius.md,
          padding: theme.spacing.sm,
          backgroundColor: theme.color.role.primarySoft,
        }}
      >
        <Text style={{ color: theme.color.role.textSecondary, fontFamily: theme.type.family.body, textAlign: 'center' }}>
          Approvals: {approvalCount} / {requiredApprovals}
        </Text>
      </View>

      {hasApproved ? (
        <View style={{ borderRadius: theme.radius.md, padding: theme.spacing.sm, backgroundColor: theme.color.role.successSoft }}>
          <Text style={{ textAlign: 'center', color: theme.color.role.success, fontFamily: theme.type.family.bodySemi }}>
            You approved this match.
          </Text>
        </View>
      ) : hasRejected ? (
        <View style={{ borderRadius: theme.radius.md, padding: theme.spacing.sm, backgroundColor: theme.color.role.secondarySoft }}>
          <Text style={{ textAlign: 'center', color: theme.color.role.secondary, fontFamily: theme.type.family.bodySemi }}>
            You rejected this match.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <PrimaryButton label="Reject" secondary onPress={handleReject} loading={processing} style={{ flex: 1 }} />
          <PrimaryButton label="Approve" onPress={handleApprove} loading={processing} style={{ flex: 1 }} />
        </View>
      )}
    </GlassCard>
  );
}

export default function ApprovalsScreen() {
  const { theme } = useAppTheme();
  const { matches, loading, approveMatch, rejectMatch, refresh } = usePendingMatches();

  return (
    <AppScreen
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[theme.color.role.primary]} />}
      contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 50 }}
    >
      <GradientHeader title="Pending Approvals" subtitle="Review and approve matches you participated in." />

      {loading && matches.length === 0 ? (
        <GlassCard style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <ActivityIndicator size="large" color={theme.color.role.primary} />
          <Text style={{ marginTop: theme.spacing.sm, color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>
            Loading matches...
          </Text>
        </GlassCard>
      ) : matches.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          subtitle="Matches you participate in will appear here for approval."
          icon="checkmark-done-outline"
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onApprove={async () => await approveMatch(match.id)}
              onReject={async () => await rejectMatch(match.id)}
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}
