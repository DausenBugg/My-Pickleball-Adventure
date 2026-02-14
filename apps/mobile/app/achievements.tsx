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
          headerStyle: { backgroundColor: colors.blue },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontFamily: typography.families.semibold },
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
    backgroundColor: colors.background,
  },
  summary: {
    margin: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  summaryText: {
    color: colors.ink,
    fontSize: typography.sizes.lg,
    fontFamily: typography.families.semibold,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    fontFamily: typography.families.semibold,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnlocked: {
    backgroundColor: colors.surface,
  },
  cardLocked: {
    backgroundColor: colors.panel,
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
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.ink,
    fontSize: typography.sizes.md,
    fontFamily: typography.families.semibold,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.muted,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    fontFamily: typography.families.regular,
  },
  lockedText: {
    color: colors.muted,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.blueSoft,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
  },
  progressText: {
    color: colors.muted,
    fontSize: typography.sizes.xs,
    fontFamily: typography.families.medium,
    minWidth: 40,
    textAlign: 'right',
  },
  unlockedDate: {
    color: colors.muted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    fontFamily: typography.families.medium,
  },
});


