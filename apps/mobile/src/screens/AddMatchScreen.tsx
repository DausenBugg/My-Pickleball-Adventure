import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Player, usePlayerSearch } from '../hooks/usePlayerSearch';
import { MatchParticipant, useSubmitMatch } from '../hooks/useSubmitMatch';
import { useAuth } from '../state/auth';
import { AppScreen, GlassCard, GradientHeader, PrimaryButton, SegmentedControl } from '../components/ui';
import { useAppTheme } from '../theme';

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
  const { theme } = useAppTheme();
  const { players, loading } = usePlayerSearch(value);

  if (selectedPlayer) {
    return (
      <View style={{ gap: 8 }}>
        <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>
          {label}
        </Text>
        <View
          style={[
            styles.selectedPlayer,
            {
              borderRadius: theme.radius.md,
              borderColor: theme.color.role.primary,
              backgroundColor: theme.color.role.primarySoft,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>
              {selectedPlayer.full_name || 'Player'}
            </Text>
            <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
              Level {selectedPlayer.level} | {selectedPlayer.wins}W {selectedPlayer.losses}L
            </Text>
          </View>
          <Pressable onPress={onClearPlayer}>
            <Text style={{ color: theme.color.role.primary, fontFamily: theme.type.family.bodySemi }}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.color.role.textMuted}
        style={[
          styles.input,
          {
            borderColor: theme.color.role.border,
            borderRadius: theme.radius.md,
            color: theme.color.role.textPrimary,
            backgroundColor: theme.color.role.surfaceAlt,
            fontFamily: theme.type.family.body,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
      />
      {loading && value.trim().length > 1 ? (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="small" color={theme.color.role.primary} />
          <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body }}>Searching...</Text>
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length > 0 ? (
        <View
          style={[
            styles.suggestions,
            {
              borderRadius: theme.radius.md,
              borderColor: theme.color.role.border,
              backgroundColor: theme.color.role.surface,
            },
          ]}
        >
          {players.map((player) => (
            <Pressable
              key={player.id}
              style={[styles.suggestionItem, { borderBottomColor: theme.color.role.border }]}
              onPress={() => onSelectPlayer(player)}
            >
              <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>
                {player.full_name || 'Player'}
              </Text>
              <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
                Level {player.level} | {player.wins}W {player.losses}L
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length === 0 ? (
        <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
          No matching players
        </Text>
      ) : null}
    </View>
  );
}

export default function AddMatchScreen({ modal = false }: { modal?: boolean }) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { submitMatch, loading: submitting, error: submitError } = useSubmitMatch();

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
    if (!userScore || !opponentScore) return { valid: false, message: 'Enter both scores to continue.' };
    if (Number.isNaN(parsedUserScore) || Number.isNaN(parsedOpponentScore)) return { valid: false, message: 'Scores must be numbers.' };
    if (parsedUserScore < 0 || parsedOpponentScore < 0) return { valid: false, message: 'Scores must be 0 or higher.' };
    if (parsedUserScore === parsedOpponentScore) return { valid: false, message: 'Scores cannot be tied.' };

    const winnerScore = Math.max(parsedUserScore, parsedOpponentScore);
    const loserScore = Math.min(parsedUserScore, parsedOpponentScore);
    if (winnerScore < 11) return { valid: false, message: 'Winner must have at least 11 points.' };
    if (winnerScore - loserScore < 2) return { valid: false, message: 'Winner must lead by 2 points.' };
    if (!opponent) return { valid: false, message: 'Select an opponent to continue.' };
    if (matchType === 'doubles' && (!ally || !opponent2)) {
      return { valid: false, message: 'Select all players for doubles match.' };
    }

    return { valid: true, message: 'Ready to submit.' };
  }, [userScore, opponentScore, parsedUserScore, parsedOpponentScore, opponent, matchType, ally, opponent2]);

  const handleSubmit = async () => {
    if (!validation.valid) {
      Alert.alert('Unable to submit', validation.message);
      return;
    }

    if (!session?.user?.id || !opponent) {
      Alert.alert('Unable to submit', 'Missing required player or session data.');
      return;
    }

    const userTeam: 'team_a' | 'team_b' = parsedUserScore > parsedOpponentScore ? 'team_a' : 'team_b';
    const opponentTeam: 'team_a' | 'team_b' = userTeam === 'team_a' ? 'team_b' : 'team_a';

    const participants: MatchParticipant[] = [
      { userId: session.user.id, team: userTeam },
      { userId: opponent.id, team: opponentTeam },
    ];

    if (matchType === 'doubles' && ally && opponent2) {
      participants.push({ userId: ally.id, team: userTeam }, { userId: opponent2.id, team: opponentTeam });
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
        'Match submitted',
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
              if (modal) router.back();
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', result?.error || submitError || 'Match submission failed. Please try again.');
    }
  };

  return (
    <AppScreen>
      <GradientHeader
        title="Add Match"
        subtitle="Fast logging with modern match validation."
        right={
          modal ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={[
                styles.closeBtn,
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderColor: theme.color.role.border,
                  backgroundColor: theme.color.role.surface,
                },
              ]}
            >
              <Ionicons name="close" size={20} color={theme.color.role.textPrimary} />
            </Pressable>
          ) : null
        }
      />

      <GlassCard style={{ gap: theme.spacing.md }}>
        <Text style={[styles.sectionTitle, { color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }]}>
          Match Type
        </Text>
        <SegmentedControl
          value={matchType}
          onChange={setMatchType}
          options={[
            { label: 'Singles', value: 'singles' },
            { label: 'Doubles', value: 'doubles' },
          ]}
        />

        <Text style={[styles.sectionTitle, { color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }]}>
          Match Mode
        </Text>
        <SegmentedControl
          value={matchMode}
          onChange={setMatchMode}
          options={[
            { label: 'Casual', value: 'casual' },
            { label: 'Ranked', value: 'ranked' },
          ]}
        />
        <Text style={{ color: theme.color.role.textMuted, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.sm }}>
          Ranked matches update your rating after approval.
        </Text>
      </GlassCard>

      <GlassCard style={{ gap: theme.spacing.md }}>
        <Text style={[styles.sectionTitle, { color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }]}>
          Scores
        </Text>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>Your Score</Text>
            <TextInput
              placeholder="11"
              keyboardType="number-pad"
              placeholderTextColor={theme.color.role.textMuted}
              style={[
                styles.input,
                {
                  borderColor: theme.color.role.border,
                  borderRadius: theme.radius.md,
                  color: theme.color.role.textPrimary,
                  backgroundColor: theme.color.role.surfaceAlt,
                  fontFamily: theme.type.family.body,
                },
              ]}
              value={userScore}
              onChangeText={setUserScore}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.color.role.textMuted, fontFamily: theme.type.family.bodySemi }]}>
              Opponent Score
            </Text>
            <TextInput
              placeholder="9"
              keyboardType="number-pad"
              placeholderTextColor={theme.color.role.textMuted}
              style={[
                styles.input,
                {
                  borderColor: theme.color.role.border,
                  borderRadius: theme.radius.md,
                  color: theme.color.role.textPrimary,
                  backgroundColor: theme.color.role.surfaceAlt,
                  fontFamily: theme.type.family.body,
                },
              ]}
              value={opponentScore}
              onChangeText={setOpponentScore}
            />
          </View>
        </View>

        <View
          style={{
            borderRadius: theme.radius.md,
            backgroundColor: validation.valid ? theme.color.role.successSoft : theme.color.role.secondarySoft,
            padding: theme.spacing.sm,
          }}
        >
          <Text
            style={{
              color: validation.valid ? theme.color.role.success : theme.color.role.secondary,
              fontFamily: theme.type.family.bodySemi,
            }}
          >
            {validation.message}
          </Text>
        </View>
      </GlassCard>

      <GlassCard style={{ gap: theme.spacing.md }}>
        <Text style={[styles.sectionTitle, { color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }]}>
          Players
        </Text>
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
              label="Your Ally"
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
      </GlassCard>

      <GlassCard>
        <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.bodySemi }}>
          Approval required
        </Text>
        <Text
          style={{
            marginTop: 6,
            color: theme.color.role.textMuted,
            fontFamily: theme.type.family.body,
            lineHeight: theme.type.lineHeights.sm,
          }}
        >
          Singles require both players. Doubles require 3 of 4 approvals.
          Your submission counts as one approval.
        </Text>
      </GlassCard>

      <PrimaryButton label="Submit match" loading={submitting} onPress={handleSubmit} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 17,
  },
  input: {
    borderWidth: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestions: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 2,
  },
  selectedPlayer: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
