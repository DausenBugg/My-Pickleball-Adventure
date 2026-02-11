import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  ink: '#0b1a2b',
  muted: '#5a6a7d',
  blue: '#2b6cb0',
  coral: '#ff6b5a',
  surface: '#ffffff',
  background: '#f7f8fb',
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Your KPIs</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Wins</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Losses</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Level</Text>
            <Text style={styles.cardValue}>1</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Ranking</Text>
            <Text style={styles.cardValue}>1200</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent matches</Text>
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>No matches logged yet</Text>
            <Text style={styles.matchSubtitle}>Add your first match to get started.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e4ec',
  },
  cardLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 8,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 12,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e4ec',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  matchSubtitle: {
    color: colors.muted,
    marginTop: 6,
  },
});
