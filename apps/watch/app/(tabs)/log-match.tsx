import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useRecentPlayers } from '../../src/hooks/useRecentPlayers';
import { MatchParticipant, useSubmitMatch } from '../../src/hooks/useSubmitMatch';
import { useAuth } from '../../src/state/auth';
import { watchColors } from '../../src/theme/colors';
import { watchSizing } from '../../src/theme/sizing';

type MatchType = 'singles' | 'doubles';
type MatchMode = 'casual' | 'ranked';

type SearchFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onClearPlayer: () => void;
  recentPlayers: Player[];
};

function SearchField({
  label,
  value,
  onChangeText,
  selectedPlayer,
  onSelectPlayer,
  onClearPlayer,
  recentPlayers,
}: SearchFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { players, loading } = usePlayerSearch(value);
  const trimmedQuery = value.trim();
  const showRecent = isFocused && trimmedQuery.length === 0;
  const showSearchResults = trimmedQuery.length > 0;
  const visiblePlayers = showRecent ? recentPlayers : players;

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  if (selectedPlayer) {
    return (
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.selectedPlayerRow}>
          <Text style={styles.selectedPlayerText} numberOfLines={1}>
            {selectedPlayer.full_name || selectedPlayer.email}
          </Text>
          <Pressable style={styles.tinyBtn} onPress={onClearPlayer}>
            <Text style={styles.tinyBtnText}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder="Search name/email"
        placeholderTextColor={watchColors.muted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        onFocus={() => {
          if (blurTimeoutRef.current) {
            clearTimeout(blurTimeoutRef.current);
          }
          setIsFocused(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => {
            setIsFocused(false);
          }, 120);
        }}
      />
      {loading && showSearchResults ? (
        <View style={styles.searchStateRow}>
          <ActivityIndicator size="small" color={watchColors.primary} />
          <Text style={styles.searchStateText}>Searching...</Text>
        </View>
      ) : null}
      {!loading && visiblePlayers.length > 0 && (showRecent || showSearchResults) ? (
        <View style={styles.resultsWrap}>
          {visiblePlayers.map((player) => (
            <Pressable
              key={player.id}
              style={styles.resultItem}
              onPressIn={() => {
                if (blurTimeoutRef.current) {
                  clearTimeout(blurTimeoutRef.current);
                }
              }}
              onPress={() => {
                onSelectPlayer(player);
                setIsFocused(false);
              }}
            >
              <Text style={styles.resultTitle} numberOfLines={1}>
                {player.full_name || player.email}
              </Text>
              <Text style={styles.resultMeta} numberOfLines={1}>
                L{player.level} • {player.wins}W-{player.losses}L
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!loading && showSearchResults && players.length === 0 ? (
        <Text style={styles.searchStateText}>No players found.</Text>
      ) : null}
      {!loading && showRecent && recentPlayers.length === 0 ? (
        <Text style={styles.searchStateText}>No recent players yet.</Text>
      ) : null}
    </View>
  );
}

export default function LogMatchScreen() {
  const { session } = useAuth();
  const { submitMatch, loading: submitting, error: submitError } = useSubmitMatch();
  const { players: recentPlayers } = useRecentPlayers();

  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [matchMode, setMatchMode] = useState<MatchMode>('casual');
  const [userScore, setUserScore] = useState('11');
  const [opponentScore, setOpponentScore] = useState('9');

  const [opponentSearch, setOpponentSearch] = useState('');
  const [allySearch, setAllySearch] = useState('');
  const [opponent2Search, setOpponent2Search] = useState('');

  const [opponent, setOpponent] = useState<Player | null>(null);
  const [ally, setAlly] = useState<Player | null>(null);
  const [opponent2, setOpponent2] = useState<Player | null>(null);

  const parsedUserScore = Number.parseInt(userScore, 10);
  const parsedOpponentScore = Number.parseInt(opponentScore, 10);

  const validation = useMemo(() => {
    if (!userScore || !opponentScore) return { valid: false, message: 'Enter both scores.' };
    if (Number.isNaN(parsedUserScore) || Number.isNaN(parsedOpponentScore)) {
      return { valid: false, message: 'Scores must be numbers.' };
    }
    if (parsedUserScore < 0 || parsedOpponentScore < 0) return { valid: false, message: 'Score >= 0.' };
    if (parsedUserScore === parsedOpponentScore) return { valid: false, message: 'No tied scores.' };
    const winnerScore = Math.max(parsedUserScore, parsedOpponentScore);
    const loserScore = Math.min(parsedUserScore, parsedOpponentScore);
    if (winnerScore < 11) return { valid: false, message: 'Winner needs 11+.' };
    if (winnerScore - loserScore !== 2) {
      return { valid: false, message: 'Winner must finish exactly 2 points ahead.' };
    }
    if (!opponent) return { valid: false, message: 'Select opponent.' };
    if (matchType === 'doubles' && (!ally || !opponent2)) {
      return { valid: false, message: 'Select all players.' };
    }
    return { valid: true, message: 'Ready' };
  }, [
    ally,
    matchType,
    opponent,
    opponent2,
    opponentScore,
    parsedOpponentScore,
    parsedUserScore,
    userScore,
  ]);

  const handleSubmit = async () => {
    if (!validation.valid) {
      Alert.alert('Cannot submit', validation.message);
      return;
    }

    if (!session?.user?.id || !opponent) {
      Alert.alert('Cannot submit', 'Missing session/player data.');
      return;
    }

    const userTeam: 'team_a' | 'team_b' = parsedUserScore > parsedOpponentScore ? 'team_a' : 'team_b';
    const opponentTeam: 'team_a' | 'team_b' = userTeam === 'team_a' ? 'team_b' : 'team_a';

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
      Alert.alert('Submitted', 'Match sent for approvals.');
      setOpponent(null);
      setAlly(null);
      setOpponent2(null);
      setOpponentSearch('');
      setAllySearch('');
      setOpponent2Search('');
      setUserScore('11');
      setOpponentScore('9');
      return;
    }

    Alert.alert('Failed', result?.error || submitError || 'Try again.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Log Match</Text>
        <Text style={styles.pageSubtitle}>Fast entry for watch.</Text>

        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentBtn, matchType === 'singles' ? styles.segmentBtnActive : null]}
            onPress={() => setMatchType('singles')}
          >
            <Text style={styles.segmentText}>Singles</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, matchType === 'doubles' ? styles.segmentBtnActive : null]}
            onPress={() => setMatchType('doubles')}
          >
            <Text style={styles.segmentText}>Doubles</Text>
          </Pressable>
        </View>

        <View style={styles.segmentWrap}>
          <Pressable
            style={[styles.segmentBtn, matchMode === 'casual' ? styles.segmentBtnActive : null]}
            onPress={() => setMatchMode('casual')}
          >
            <Text style={styles.segmentText}>Casual</Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, matchMode === 'ranked' ? styles.segmentBtnActiveSecondary : null]}
            onPress={() => setMatchMode('ranked')}
          >
            <Text style={styles.segmentText}>Ranked</Text>
          </Pressable>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCol}>
            <Text style={styles.fieldLabel}>Your score</Text>
            <TextInput
              style={styles.input}
              value={userScore}
              onChangeText={setUserScore}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.scoreCol}>
            <Text style={styles.fieldLabel}>Opp score</Text>
            <TextInput
              style={styles.input}
              value={opponentScore}
              onChangeText={setOpponentScore}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <SearchField
          label="Opponent"
          value={opponentSearch}
          onChangeText={setOpponentSearch}
          selectedPlayer={opponent}
          onSelectPlayer={(player) => {
            setOpponent(player);
            setOpponentSearch(player.full_name || player.email);
          }}
          onClearPlayer={() => {
            setOpponent(null);
            setOpponentSearch('');
          }}
          recentPlayers={recentPlayers}
        />

        {matchType === 'doubles' ? (
          <>
            <SearchField
              label="Teammate"
              value={allySearch}
              onChangeText={setAllySearch}
              selectedPlayer={ally}
              onSelectPlayer={(player) => {
                setAlly(player);
                setAllySearch(player.full_name || player.email);
              }}
              onClearPlayer={() => {
                setAlly(null);
                setAllySearch('');
              }}
              recentPlayers={recentPlayers}
            />

            <SearchField
              label="Opponent 2"
              value={opponent2Search}
              onChangeText={setOpponent2Search}
              selectedPlayer={opponent2}
              onSelectPlayer={(player) => {
                setOpponent2(player);
                setOpponent2Search(player.full_name || player.email);
              }}
              onClearPlayer={() => {
                setOpponent2(null);
                setOpponent2Search('');
              }}
              recentPlayers={recentPlayers}
            />
          </>
        ) : null}

        <Text style={styles.validationText}>{validation.message}</Text>

        <Pressable
          style={[styles.primaryBtn, !validation.valid || submitting ? styles.buttonDisabled : null]}
          onPress={handleSubmit}
          disabled={!validation.valid || submitting}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Submit</Text>}
        </Pressable>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
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
  segmentWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: watchSizing.controlRadius,
    backgroundColor: watchColors.primaryGhost,
    minHeight: watchSizing.controlHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: watchColors.primary,
  },
  segmentBtnActiveSecondary: {
    backgroundColor: watchColors.secondary,
  },
  segmentText: {
    color: watchColors.textOnPrimary,
    fontSize: watchSizing.subtitle,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreCol: {
    flex: 1,
    gap: 4,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    color: watchColors.muted,
    fontSize: watchSizing.label,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: watchColors.border,
    backgroundColor: watchColors.surface,
    borderRadius: watchSizing.controlRadius,
    color: watchColors.text,
    fontSize: watchSizing.bodyStrong,
    paddingHorizontal: 9,
    paddingVertical: 7,
    minHeight: watchSizing.controlHeight,
  },
  selectedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: watchSizing.controlRadius,
    backgroundColor: watchColors.primaryGhost,
    borderWidth: 1,
    borderColor: watchColors.primary,
    paddingHorizontal: 9,
    minHeight: watchSizing.controlHeight,
  },
  selectedPlayerText: {
    color: watchColors.text,
    fontSize: watchSizing.body,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  tinyBtn: {
    backgroundColor: watchColors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  tinyBtnText: {
    color: watchColors.textOnPrimary,
    fontSize: watchSizing.label,
    fontWeight: '700',
  },
  searchStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchStateText: {
    color: watchColors.muted,
    fontSize: watchSizing.label,
  },
  resultsWrap: {
    borderWidth: 1,
    borderColor: watchColors.border,
    borderRadius: watchSizing.controlRadius,
    overflow: 'hidden',
  },
  resultItem: {
    backgroundColor: watchColors.surface,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: watchColors.border,
  },
  resultTitle: {
    color: watchColors.text,
    fontSize: watchSizing.body,
    fontWeight: '600',
  },
  resultMeta: {
    color: watchColors.muted,
    fontSize: watchSizing.label,
    marginTop: 1,
  },
  validationText: {
    color: watchColors.muted,
    fontSize: watchSizing.subtitle,
    textAlign: 'center',
  },
  primaryBtn: {
    minHeight: watchSizing.buttonHeight,
    borderRadius: watchSizing.cardRadius,
    backgroundColor: watchColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  primaryBtnText: {
    color: watchColors.textOnPrimary,
    fontSize: watchSizing.bodyStrong,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: watchColors.secondary,
    fontSize: watchSizing.label,
    textAlign: 'center',
  },
});