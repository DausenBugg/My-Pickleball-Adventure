import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAchievements, UserAchievement } from '../src/hooks/useAchievements';
import { useTheme } from '../src/theme';
import { radii, shadows, spacing, typography } from '../src/theme/tokens';
import AnimatedPressable from '../src/components/AnimatedPressable';

interface AchievementCardProps {
  achievement: UserAchievement;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
}

function AchievementCard({ achievement, index, colors }: AchievementCardProps) {
  const isComplete = achievement.is_unlocked || (achievement.progress !== undefined && achievement.progress >= 100);

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 60).duration(400)}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground },
          isComplete
            ? {
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: colors.primaryGhost,
                ...shadows.md,
              }
            : { opacity: 0.55, borderWidth: 1, borderColor: colors.borderLight },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, !isComplete && { opacity: 0.5 }]}>{achievement.icon}</Text>
          {isComplete && (
            <View style={[styles.unlockedBadge, { backgroundColor: colors.primary, borderColor: colors.cardBackground }]}>
              <Ionicons name="checkmark" size={10} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text
            style={[
              styles.name,
              { color: colors.ink },
              !isComplete && { color: colors.muted },
            ]}
          >
            {achievement.name}
          </Text>
          <Text
            style={[
              styles.description,
              { color: colors.muted },
            ]}
          >
            {achievement.description}
          </Text>
          {!isComplete && achievement.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${achievement.progress}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.muted }]}>
                {Math.round(achievement.progress)}%
              </Text>
            </View>
          )}
          {achievement.is_unlocked && achievement.unlocked_at ? (
            <Text style={[styles.unlockedDate, { color: colors.muted }]}>
              Unlocked{' '}
              {new Date(achievement.unlocked_at).toLocaleDateString()}
            </Text>
          ) : isComplete ? (
            <Text style={[styles.unlockedDate, { color: colors.primary }]}>
              Completed!
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const { achievements, loading, refresh } = useAchievements();
  const { colors } = useTheme();
  const router = useRouter();

  const unlocked = achievements.filter((a) => a.is_unlocked || (a.progress !== undefined && a.progress >= 100));
  const locked = achievements.filter((a) => !a.is_unlocked && (a.progress === undefined || a.progress < 100));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {/* Header with back button */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
            <View style={styles.headerRow}>
              <AnimatedPressable
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color={colors.textOnPrimary} />
              </AnimatedPressable>
              <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Achievements</Text>
              <View style={{ width: 36 }} />
            </View>
          </View>
        </Animated.View>

        {/* Summary */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={[styles.summary, { backgroundColor: colors.primaryGhost }]}>
            <Text style={[styles.summaryEmoji]}>🏆</Text>
            <Text style={[styles.summaryText, { color: colors.ink }]}>
              {unlocked.length} of {achievements.length} unlocked
            </Text>
          </View>
        </Animated.View>

        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Unlocked</Text>
            {unlocked.map((achievement, idx) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={idx}
                colors={colors}
              />
            ))}
          </View>
        )}

        {/* Locked Achievements */}
        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Locked</Text>
            {locked.map((achievement, idx) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                index={idx + unlocked.length}
                colors={colors}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerCard: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  summary: {
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: 8,
  },
  summaryEmoji: {
    fontSize: 36,
  },
  summaryText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
    ...shadows.sm,
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
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    minWidth: 40,
    textAlign: 'right',
  },
  unlockedDate: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});


