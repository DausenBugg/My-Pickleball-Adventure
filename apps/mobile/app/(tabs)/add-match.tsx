import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  ink: '#0b1a2b',
  muted: '#5a6a7d',
  blue: '#2b6cb0',
  coral: '#ff6b5a',
  surface: '#ffffff',
  background: '#f7f8fb',
  border: '#e0e4ec',
};

const sampleUsers = [
  'Avery Johnson',
  'Blake Carter',
  'Casey Morgan',
  'Drew Sanchez',
  'Emery Patel',
  'Jordan Lee',
  'Kai Howard',
  'Riley Brooks',
];

type MatchType = 'singles' | 'doubles';
type MatchMode = 'casual' | 'ranked';

type SearchFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};

function SearchField({ label, placeholder, value, onChangeText }: SearchFieldProps) {
  const matches = useMemo(() => {
    if (!value.trim()) return [];
    const query = value.trim().toLowerCase();
    return sampleUsers
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [value]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      {value.trim().length > 1 && matches.length > 0 ? (
        <View style={styles.suggestions}>
          {matches.map((name) => (
            <Pressable key={name} onPress={() => onChangeText(name)}>
              <Text style={styles.suggestionItem}>{name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {value.trim().length > 1 && matches.length === 0 ? (
        <Text style={styles.noMatch}>No matching players</Text>
      ) : null}
    </View>
  );
}

export default function AddMatchScreen() {
  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [matchMode, setMatchMode] = useState<MatchMode>('casual');
  const [userScore, setUserScore] = useState('');
  const [opponentScore, setOpponentScore] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [allyName, setAllyName] = useState('');
  const [opponentTwoName, setOpponentTwoName] = useState('');

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

    return { valid: true, message: 'Score looks valid.' };
  }, [opponentScore, parsedOpponentScore, parsedUserScore, userScore]);

  const winnerLabel = useMemo(() => {
    if (!validation.valid) return 'Pending';
    return parsedUserScore > parsedOpponentScore ? 'You' : 'Opponent';
  }, [parsedOpponentScore, parsedUserScore, validation.valid]);

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
            value={opponentName}
            onChangeText={setOpponentName}
          />

          {matchType === 'doubles' ? (
            <>
              <SearchField
                label="Your ally"
                placeholder="Search teammates"
                value={allyName}
                onChangeText={setAllyName}
              />
              <SearchField
                label="Opponent 2"
                placeholder="Search players"
                value={opponentTwoName}
                onChangeText={setOpponentTwoName}
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
          style={[styles.submitButton, !validation.valid && styles.submitDisabled]}
          disabled={!validation.valid}
        >
          <Text style={styles.submitText}>Submit match</Text>
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
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#eef2f7',
    borderRadius: 16,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    color: colors.muted,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.ink,
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
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
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
  },
  disabledInput: {
    color: colors.muted,
    backgroundColor: '#f1f4f8',
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: colors.ink,
  },
  noMatch: {
    color: colors.muted,
    fontSize: 12,
  },
  validationBanner: {
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  validationOk: {
    backgroundColor: '#eaf7ef',
  },
  validationError: {
    backgroundColor: '#fff2f0',
  },
  validationText: {
    color: colors.ink,
    fontWeight: '600',
  },
  validationMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  approvalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  approvalTitle: {
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 6,
  },
  approvalText: {
    color: colors.muted,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.coral,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#f0b2a9',
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
