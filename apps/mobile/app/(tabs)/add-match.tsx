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
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Player, usePlayerSearch } from '../../src/hooks/usePlayerSearch';
import { MatchParticipant, useSubmitMatch } from '../../src/hooks/useSubmitMatch';
import { useAuth } from '../../src/state/auth';
import { useTheme } from '../../src/theme';
import { radii, shadows, spacing, typography } from '../../src/theme/tokens';
import AnimatedPressable from '../../src/components/AnimatedPressable';

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
  colors: ReturnType<typeof useTheme>['colors'];
};

function SearchField({
  label,
  placeholder,
  value,
  onChangeText,
  selectedPlayer,
  onSelectPlayer,
  onClearPlayer,
  colors,
}: SearchFieldProps) {
  const { players, loading } = usePlayerSearch(value);

  if (selectedPlayer) {
    return (
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <View style={[styles.selectedPlayer, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
          <View>
            <Text style={[styles.selectedPlayerName, { color: colors.ink }]}>
              {selectedPlayer.full_name || 'Player'}
            </Text>
            <Text style={[styles.selectedPlayerMeta, { color: colors.muted }]}>
              Level {selectedPlayer.level} • {selectedPlayer.wins}W -{' '}
              {selectedPlayer.losses}L
            </Text>
          </View>
          <AnimatedPressable onPress={onClearPlayer} style={[styles.clearButton, { backgroundColor: colors.borderLight }]}>
            <Text style={[styles.clearButtonText, { color: colors.ink }]}>Change</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
      />
      {loading && value.trim().length > 1 ? (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.searchLoadingText, { color: colors.muted }]}>Searching...</Text>
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length > 0 ? (
        <View style={[styles.suggestions, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
          {players.map((player) => (
            <Pressable key={player.id} onPress={() => onSelectPlayer(player)}>
              <View style={[styles.suggestionItem, { borderBottomColor: colors.borderLight }]}>
                <View>
                  <Text style={[styles.suggestionName, { color: colors.ink }]}>
                    {player.full_name || 'Player'}
                  </Text>
                  <Text style={[styles.suggestionMeta, { color: colors.muted }]}>
                    Level {player.level} • {player.wins}W - {player.losses}L
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length === 0 ? (
        <Text style={[styles.noMatch, { color: colors.muted }]}>No matching players</Text>
      ) : null}
    </View>
  );
}

export default function AddMatchScreen() {
  const { session } = useAuth();
  const { submitMatch, loading: submitting, error: submitError } = useSubmitMatch();
  const { colors } = useTheme();

  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [matchMode, setMatchMode] = useState<MatchMode>('casual');
  const [userScore, setUserScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');

  const [opponentSearch, setOpponentSearch] = useState('');
  const [allySearch, setAllySearch] = useState('');
  const [opponent2Search, setOpponent2Search] = useState('');

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.ink }]}>Add match</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Log a match and submit it for approval.
          </Text>
        </Animated.View>

        {/* Match type */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Match type</Text>
          <View style={[styles.segment, { backgroundColor: colors.borderLight }]}>
            <AnimatedPressable
              style={[
                styles.segmentButton,
                matchType === 'singles' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setMatchType('singles')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.muted },
                  matchType === 'singles' && { color: colors.textOnPrimary },
                ]}
              >
                Singles
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                styles.segmentButton,
                matchType === 'doubles' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setMatchType('doubles')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.muted },
                  matchType === 'doubles' && { color: colors.textOnPrimary },
                ]}
              >
                Doubles
              </Text>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* Match mode */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Match mode</Text>
          <View style={[styles.segment, { backgroundColor: colors.borderLight }]}>
            <AnimatedPressable
              style={[
                styles.segmentButton,
                matchMode === 'casual' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setMatchMode('casual')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.muted },
                  matchMode === 'casual' && { color: colors.textOnPrimary },
                ]}
              >
                Casual
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                styles.segmentButton,
                matchMode === 'ranked' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setMatchMode('ranked')}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.muted },
                  matchMode === 'ranked' && { color: colors.textOnPrimary },
                ]}
              >
                Ranked
              </Text>
            </AnimatedPressable>
          </View>
          <Text style={[styles.helperText, { color: colors.muted }]}>
            Ranked matches update your rating after approval.
          </Text>
        </Animated.View>

        {/* Scores */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Scores</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Your score</Text>
              <TextInput
                placeholder="11"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={[styles.scoreInput, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
                value={userScore}
                onChangeText={setUserScore}
              />
            </View>
            <View style={styles.scoreDivider}>
              <Text style={[styles.scoreDash, { color: colors.muted }]}>vs</Text>
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.muted }]}>Opponent score</Text>
              <TextInput
                placeholder="9"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                style={[styles.scoreInput, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.ink }]}
                value={opponentScore}
                onChangeText={setOpponentScore}
              />
            </View>
          </View>

          {matchType === 'doubles' ? (
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.muted }]}>Ally score</Text>
                <TextInput
                  editable={false}
                  style={[styles.scoreInput, { backgroundColor: colors.borderLight, borderColor: colors.borderLight, color: colors.muted }]}
                  value={userScore}
                  placeholder="Same as team"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <View style={styles.scoreDivider} />
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.muted }]}>Opponent 2 score</Text>
                <TextInput
                  editable={false}
                  style={[styles.scoreInput, { backgroundColor: colors.borderLight, borderColor: colors.borderLight, color: colors.muted }]}
                  value={opponentScore}
                  placeholder="Same as team"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.validationBanner,
              { backgroundColor: validation.valid ? colors.successGhost : colors.secondaryGhost },
            ]}
          >
            <View style={styles.validationRow}>
              <Ionicons
                name={validation.valid ? 'checkmark-circle' : 'information-circle'}
                size={18}
                color={validation.valid ? colors.success : colors.secondary}
              />
              <Text style={[styles.validationText, { color: colors.ink }]}>{validation.message}</Text>
            </View>
            <Text style={[styles.validationMeta, { color: colors.muted }]}>Winner: {winnerLabel}</Text>
          </View>
        </Animated.View>

        {/* Players */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Players</Text>
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
            colors={colors}
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
                colors={colors}
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
                colors={colors}
              />
            </>
          ) : null}
        </Animated.View>

        {/* Approval info */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.section}>
          <View style={[styles.approvalCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={styles.approvalHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={[styles.approvalTitle, { color: colors.ink }]}>Approval required</Text>
            </View>
            <Text style={[styles.approvalText, { color: colors.muted }]}>
              Singles require both players. Doubles require 3 of 4 approvals.
              Your submission counts as one approval.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(400)}>
          <AnimatedPressable
            style={[
              styles.submitButton,
              { backgroundColor: colors.secondary },
              (!validation.valid || submitting) && { opacity: 0.5 },
            ]}
            disabled={submitting}
            onPress={handleSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.submitRow}>
                <Ionicons name="add-circle" size={22} color="#ffffff" />
                <Text style={styles.submitText}>Submit match</Text>
              </View>
            )}
          </AnimatedPressable>
        </Animated.View>

        <View style={{ height: 100 }} />
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
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  subtitle: {},
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  segmentText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  helperText: {
    fontSize: typography.sizes.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  field: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: typography.sizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  input: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    fontSize: typography.sizes.base,
  },
  scoreInput: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    ...shadows.sm,
  },
  scoreDivider: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  scoreDash: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
  },
  searchLoadingText: {
    fontSize: typography.sizes.sm,
  },
  suggestions: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  suggestionName: {
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  suggestionMeta: {
    fontSize: typography.sizes.sm,
  },
  selectedPlayer: {
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPlayerName: {
    fontWeight: typography.weights.semibold,
    marginBottom: 2,
  },
  selectedPlayerMeta: {
    fontSize: typography.sizes.sm,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  noMatch: {
    fontSize: typography.sizes.sm,
  },
  validationBanner: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validationText: {
    fontWeight: typography.weights.semibold,
  },
  validationMeta: {
    fontSize: typography.sizes.sm,
    marginLeft: 24,
  },
  approvalCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  approvalTitle: {
    fontWeight: typography.weights.semibold,
  },
  approvalText: {
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.md,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});
