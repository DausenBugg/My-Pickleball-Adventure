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

type MatchType = 'singles' | 'doubles';
type MatchMode = 'casual' | 'ranked';

type SearchFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onClearPlayer: () => void;
};

function SearchField({
  label,
  value,
  onChangeText,
  selectedPlayer,
  onSelectPlayer,
  onClearPlayer,
}: SearchFieldProps) {
  const { players, loading } = usePlayerSearch(value);

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
        placeholderTextColor="#8EA1C7"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      {loading && value.trim().length > 1 ? (
        <View style={styles.searchStateRow}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.searchStateText}>Searching...</Text>
        </View>
      ) : null}
      {!loading && value.trim().length > 1 && players.length > 0 ? (
        <View style={styles.resultsWrap}>
          {players.map((player) => (
            <Pressable key={player.id} style={styles.resultItem} onPress={() => onSelectPlayer(player)}>
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
      {!loading && value.trim().length > 1 && players.length === 0 ? (
        <Text style={styles.searchStateText}>No players found.</Text>
      ) : null}
    </View>
  );
}

export default function LogMatchScreen() {
  const { session } = useAuth();
  const { submitMatch, loading: submitting, error: submitError } = useSubmitMatch();

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
    if (winnerScore - loserScore < 2) return { valid: false, message: 'Win by 2.' };
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
            style={[styles.segmentBtn, matchMode === 'ranked' ? styles.segmentBtnActive : null]}
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
  segmentWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1A253C',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#355FD3',
  },
  segmentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreCol: {
    flex: 1,
    gap: 4,
  },
  fieldWrap: {
    gap: 5,
  },
  fieldLabel: {
    color: '#C8D5EE',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#25324A',
    backgroundColor: '#121B2E',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 40,
  },
  selectedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    backgroundColor: '#16243D',
    borderWidth: 1,
    borderColor: '#2F4B86',
    paddingHorizontal: 10,
    minHeight: 40,
  },
  selectedPlayerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  tinyBtn: {
    backgroundColor: '#2B3B5D',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tinyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchStateText: {
    color: '#95A7CA',
    fontSize: 11,
  },
  resultsWrap: {
    borderWidth: 1,
    borderColor: '#23314B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultItem: {
    backgroundColor: '#121B2E',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#23314B',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  resultMeta: {
    color: '#97AAD0',
    fontSize: 11,
    marginTop: 1,
  },
  validationText: {
    color: '#AFC1E3',
    fontSize: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#3E6AE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#FF9AA2',
    fontSize: 11,
    textAlign: 'center',
  },
});