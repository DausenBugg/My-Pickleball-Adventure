import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAchievements, UserAchievement } from '../src/hooks/useAchievements';
import { colors, radii, spacing, typography } from '../src/theme';

interface AchievementCardProps {
  achievement: UserAchievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <View
      style={[
        styles.card,
        achievement.is_unlocked ? styles.cardUnlocked : styles.cardLocked,
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{achievement.icon}</Text>
        {achievement.is_unlocked && <View style={styles.unlockedBadge} />}
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.name,
            !achievement.is_unlocked && styles.lockedText,
          ]}
        >
          {achievement.name}
        </Text>
        <Text
          style={[
            styles.description,
            !achievement.is_unlocked && styles.lockedText,
          ]}
        >
          {achievement.description}
        </Text>
        {!achievement.is_unlocked && achievement.progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${achievement.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(achievement.progress)}%
            </Text>
          </View>
        )}
        {achievement.is_unlocked && (
          <Text style={styles.unlockedDate}>
            Unlocked{' '}
            {new Date(achievement.unlocked_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const { achievements, loading, refresh } = useAchievements();

  const unlocked = achievements.filter((a) => a.is_unlocked);
  const locked = achievements.filter((a) => !a.is_unlocked);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Achievements',
          headerStyle: { backgroundColor: colors.blue[600] },
          headerTintColor: colors.ink[0],
          headerTitleStyle: { fontWeight: typography.weights.bold },
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {unlocked.length} of {achievements.length} unlocked
          </Text>
        </View>

        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unlocked</Text>
            {unlocked.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </View>
        )}

        {/* Locked Achievements */}
        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locked</Text>
            {locked.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink[950],
  },
  summary: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.ink[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[800],
  },
  summaryText: {
    color: colors.ink[100],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.ink[200],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
  },
  cardUnlocked: {
    backgroundColor: colors.ink[900],
    borderWidth: 1,
    borderColor: colors.blue[600],
  },
  cardLocked: {
    backgroundColor: colors.ink[900],
    opacity: 0.6,
  },
  iconContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 48,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.blue[600],
    borderWidth: 2,
    borderColor: colors.ink[900],
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.ink[0],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.ink[200],
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  lockedText: {
    color: colors.ink[400],
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.ink[800],
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue[600],
  },
  progressText: {
    color: colors.ink[300],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    minWidth: 40,
    textAlign: 'right',
  },
  unlockedDate: {
    color: colors.ink[400],
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});


