import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Player, usePlayerSearch } from '../../src/hooks/usePlayerSearch';
import { MatchParticipant, useSubmitMatch } from '../../src/hooks/useSubmitMatch';
import { useAuth } from '../../src/state/auth';
import { colors, radii, spacing, typography } from '../../src/theme';

type MatchType = 'singles' | 'doubles';
type MatchMode = 'casual' | 'ranked';

type SearchFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onClearPlayer: () => void;
};

function SearchField({
  label,
  placeholder,
  value,
  onChangeText,
  selectedPlayer,
  onSelectPlayer,
  onClearPlayer,
}: SearchFieldProps) {
  const { players, loading } = usePlayerSearch(value);

  if (selectedPlayer) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.selectedPlayer}>
          <View>
            <Text style={styles.selectedPlayerName}>
              {selectedPlayer.full_name || 'Player'}
            </Text>
            <Text style={styles.selectedPlayerMeta}>
              Level {selectedPlayer.level} • {selectedPlayer.wins}W -{' '}
              {selectedPlayer.losses}L
            </Text>
          </View>
          <Pressable onPress={onClearPlayer} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
        placeholderTextColor={colors.muted}
      />
      {loading && value.trim().length > 1 ? (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="small" color={colors.blue} />
          <Text style={styles.searchLoadingText}>Searching...</Text>
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length > 0 ? (
        <View style={styles.suggestions}>
          {players.map((player) => (
            <Pressable key={player.id} onPress={() => onSelectPlayer(player)}>
              <View style={styles.suggestionItem}>
                <View>
                  <Text style={styles.suggestionName}>
                    {player.full_name || 'Player'}
                  </Text>
                  <Text style={styles.suggestionMeta}>
                    Level {player.level} • {player.wins}W - {player.losses}L
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length === 0 ? (
        <Text style={styles.noMatch}>No matching players</Text>
      ) : null}
    </View>
  );
}

export default function AddMatchScreen() {
  const { session } = useAuth();
  const { submitMatch, loading: submitting, error: submitError } = useSubmitMatch();

  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [matchMode, setMatchMode] = useState<MatchMode>('casual');
  const [userScore, setUserScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');

  // Player search states
  const [opponentSearch, setOpponentSearch] = useState('');
  const [allySearch, setAllySearch] = useState('');
  const [opponent2Search, setOpponent2Search] = useState('');

  // Selected players
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [ally, setAlly] = useState<Player | null>(null);
  const [opponent2, setOpponent2] = useState<Player | null>(null);

  const parsedUserScore = Number.parseInt(userScore, 10);
  const parsedOpponentScore = Number.parseInt(opponentScore, 10);

  const validation = useMemo(() => {
    if (!userScore || !opponentScore) {
      return { valid: false, message: 'Enter both scores to continue.' };
    }

    if (Number.isNaN(parsedUserScore) || Number.isNaN(parsedOpponentScore)) {
      return { valid: false, message: 'Scores must be numbers.' };
    }

    if (parsedUserScore < 0 || parsedOpponentScore < 0) {
      return { valid: false, message: 'Scores must be 0 or higher.' };
    }

    if (parsedUserScore === parsedOpponentScore) {
      return { valid: false, message: 'Scores cannot be tied.' };
    }

    const winnerScore = Math.max(parsedUserScore, parsedOpponentScore);
    const loserScore = Math.min(parsedUserScore, parsedOpponentScore);

    if (winnerScore < 11) {
      return { valid: false, message: 'Winner must have at least 11 points.' };
    }

    if (winnerScore - loserScore < 2) {
      return { valid: false, message: 'Winner must lead by 2 points.' };
    }

    // Check player selection
    if (!opponent) {
      return { valid: false, message: 'Select an opponent to continue.' };
    }

    if (matchType === 'doubles' && (!ally || !opponent2)) {
      return { valid: false, message: 'Select all players for doubles match.' };
    }

    return { valid: true, message: 'Ready to submit!' };
  }, [
    opponentScore,
    parsedOpponentScore,
    parsedUserScore,
    userScore,
    opponent,
    matchType,
    ally,
    opponent2,
  ]);

  const winnerLabel = useMemo(() => {
    if (!validation.valid) return 'Pending';
    return parsedUserScore > parsedOpponentScore ? 'You' : 'Opponent';
  }, [parsedOpponentScore, parsedUserScore, validation.valid]);

  const handleSubmit = async () => {
    if (!validation.valid) {
      Alert.alert('Unable to submit', validation.message);
      return;
    }

    if (!session?.user?.id || !opponent) {
      Alert.alert('Unable to submit', 'Missing required player or session data.');
      return;
    }

    // Build participants list
    const userTeam: 'team_a' | 'team_b' =
      parsedUserScore > parsedOpponentScore ? 'team_a' : 'team_b';
    const opponentTeam: 'team_a' | 'team_b' =
      userTeam === 'team_a' ? 'team_b' : 'team_a';

    const participants: MatchParticipant[] = [
      { userId: session.user.id, team: userTeam },
      { userId: opponent.id, team: opponentTeam },
    ];

    if (matchType === 'doubles' && ally && opponent2) {
      participants.push(
        { userId: ally.id, team: userTeam },
        { userId: opponent2.id, team: opponentTeam }
      );
    }

    const result = await submitMatch({
      matchType,
      matchMode,
      teamAScore: parsedUserScore,
      teamBScore: parsedOpponentScore,
      participants,
    });

    if (result?.data) {
      Alert.alert(
        'Match submitted!',
        'Your match has been submitted and is awaiting approval from other players.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setUserScore('');
              setOpponentScore('');
              setOpponent(null);
              setAlly(null);
              setOpponent2(null);
              setOpponentSearch('');
              setAllySearch('');
              setOpponent2Search('');
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', result?.error || submitError || 'Match submission failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add match</Text>
          <Text style={styles.subtitle}>
            Log a match and submit it for approval.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match type</Text>
          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentButton,
                matchType === 'singles' && styles.segmentActive,
              ]}
              onPress={() => setMatchType('singles')}
            >
              <Text
                style={[
                  styles.segmentText,
                  matchType === 'singles' && styles.segmentTextActive,
                ]}
              >
                Singles
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                matchType === 'doubles' && styles.segmentActive,
              ]}
              onPress={() => setMatchType('doubles')}
            >
              <Text
                style={[
                  styles.segmentText,
                  matchType === 'doubles' && styles.segmentTextActive,
                ]}
              >
                Doubles
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match mode</Text>
          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentButton,
                matchMode === 'casual' && styles.segmentActive,
              ]}
              onPress={() => setMatchMode('casual')}
            >
              <Text
                style={[
                  styles.segmentText,
                  matchMode === 'casual' && styles.segmentTextActive,
                ]}
              >
                Casual
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                matchMode === 'ranked' && styles.segmentActive,
              ]}
              onPress={() => setMatchMode('ranked')}
            >
              <Text
                style={[
                  styles.segmentText,
                  matchMode === 'ranked' && styles.segmentTextActive,
                ]}
              >
                Ranked
              </Text>
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            Ranked matches update your rating after approval.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scores</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Your score</Text>
              <TextInput
                placeholder="11"
                keyboardType="number-pad"
                style={styles.input}
                value={userScore}
                onChangeText={setUserScore}
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Opponent score</Text>
              <TextInput
                placeholder="9"
                keyboardType="number-pad"
                style={styles.input}
                value={opponentScore}
                onChangeText={setOpponentScore}
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          {matchType === 'doubles' ? (
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Ally score</Text>
                <TextInput
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                  value={userScore}
                  placeholder="Same as team"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Opponent 2 score</Text>
                <TextInput
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                  value={opponentScore}
                  placeholder="Same as team"
                />
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.validationBanner,
              validation.valid ? styles.validationOk : styles.validationError,
            ]}
          >
            <Text style={styles.validationText}>{validation.message}</Text>
            <Text style={styles.validationMeta}>Winner: {winnerLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Players</Text>
          <SearchField
            label="Opponent"
            placeholder="Search players"
            value={opponentSearch}
            onChangeText={setOpponentSearch}
            selectedPlayer={opponent}
            onSelectPlayer={(player) => {
              setOpponent(player);
              setOpponentSearch('');
            }}
            onClearPlayer={() => setOpponent(null)}
          />

          {matchType === 'doubles' ? (
            <>
              <SearchField
                label="Your ally"
                placeholder="Search teammates"
                value={allySearch}
                onChangeText={setAllySearch}
                selectedPlayer={ally}
                onSelectPlayer={(player) => {
                  setAlly(player);
                  setAllySearch('');
                }}
                onClearPlayer={() => setAlly(null)}
              />
              <SearchField
                label="Opponent 2"
                placeholder="Search players"
                value={opponent2Search}
                onChangeText={setOpponent2Search}
                selectedPlayer={opponent2}
                onSelectPlayer={(player) => {
                  setOpponent2(player);
                  setOpponent2Search('');
                }}
                onClearPlayer={() => setOpponent2(null)}
              />
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.approvalCard}>
            <Text style={styles.approvalTitle}>Approval required</Text>
            <Text style={styles.approvalText}>
              Singles require both players. Doubles require 3 of 4 approvals.
              Your submission counts as one approval.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.submitButton,
            (!validation.valid || submitting) && styles.submitDisabled,
          ]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Submit match</Text>
          )}
        </Pressable>
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
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.families.bold,
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.families.regular,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.families.semibold,
    color: colors.ink,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.blueSoft,
    borderRadius: radii.lg,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  segmentText: {
    color: colors.muted,
    fontFamily: typography.families.semibold,
  },
  segmentTextActive: {
    color: colors.ink,
  },
  helperText: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.regular,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.7,
    fontFamily: typography.families.semibold,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    fontFamily: typography.families.regular,
  },
  disabledInput: {
    color: colors.muted,
    backgroundColor: colors.panel,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
  },
  searchLoadingText: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.medium,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionName: {
    color: colors.ink,
    fontFamily: typography.families.semibold,
    marginBottom: 2,
  },
  suggestionMeta: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.regular,
  },
  selectedPlayer: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.blue,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPlayerName: {
    color: colors.ink,
    fontFamily: typography.families.semibold,
    marginBottom: 2,
  },
  selectedPlayerMeta: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.regular,
  },
  clearButton: {
    backgroundColor: colors.blueSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  clearButtonText: {
    color: colors.blueDark,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.semibold,
  },
  noMatch: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.medium,
  },
  validationBanner: {
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 4,
  },
  validationOk: {
    backgroundColor: colors.blueSoft,
  },
  validationError: {
    backgroundColor: colors.coralSoft,
  },
  validationText: {
    color: colors.ink,
    fontFamily: typography.families.semibold,
  },
  validationMeta: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.regular,
  },
  approvalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  approvalTitle: {
    fontFamily: typography.families.semibold,
    color: colors.ink,
    marginBottom: 6,
  },
  approvalText: {
    color: colors.muted,
    lineHeight: 20,
    fontFamily: typography.families.regular,
  },
  submitButton: {
    backgroundColor: colors.blue,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#9ad4ff',
  },
  submitText: {
    color: '#ffffff',
    fontFamily: typography.families.semibold,
    fontSize: typography.sizes.md,
  },
});
