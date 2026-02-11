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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your KPIs</Text>
            <Text style={styles.subtitle}>Last 7 days overview</Text>
          </View>
          <View style={styles.rankPill}>
            <Text style={styles.rankLabel}>Ranking</Text>
            <Text style={styles.rankValue}>1200</Text>
          </View>
        </View>

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
            <Text style={styles.cardLabel}>XP to next</Text>
            <Text style={styles.cardValue}>80</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Level progress</Text>
            <Text style={styles.progressMeta}>120 / 200 XP</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressHint}>2 wins away from Level 2</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent matches</Text>
          <View style={styles.matchList}>
            <View style={styles.matchCard}>
              <View>
                <Text style={styles.matchTitle}>No matches logged yet</Text>
                <Text style={styles.matchSubtitle}>
                  Add your first match to get started.
                </Text>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>New</Text>
              </View>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
  },
  rankPill: {
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  rankLabel: {
    color: '#d7e7ff',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rankValue: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
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
  progressCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e4ec',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  progressMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e7ecf4',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.coral,
    borderRadius: 999,
  },
  progressHint: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 12,
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
  matchList: {
    gap: 12,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e4ec',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  matchBadge: {
    backgroundColor: '#eaf1ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
