import { RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAchievements, UserAchievement } from '../src/hooks/useAchievements';
import { AppScreen, EmptyState, GlassCard, GradientHeader } from '../src/components/ui';
import { useAppTheme } from '../src/theme';

function AchievementCard({ achievement }: { achievement: UserAchievement }) {
  const { theme } = useAppTheme();

  return (
    <GlassCard
      style={{
        borderColor: achievement.is_unlocked ? theme.color.role.primary : theme.color.role.border,
        opacity: achievement.is_unlocked ? 1 : 0.88,
      }}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View
          style={{
            width: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 36 }}>{achievement.icon}</Text>
          {achievement.is_unlocked ? (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.color.role.primary}
              style={{ position: 'absolute', bottom: 0, right: 2 }}
            />
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: achievement.is_unlocked ? theme.color.role.textPrimary : theme.color.role.textSecondary,
              fontSize: theme.type.sizes.base,
              fontFamily: theme.type.family.bodySemi,
            }}
          >
            {achievement.name}
          </Text>
          <Text
            style={{
              marginTop: 4,
              color: theme.color.role.textMuted,
              fontSize: theme.type.sizes.sm,
              lineHeight: theme.type.lineHeights.sm,
              fontFamily: theme.type.family.body,
            }}
          >
            {achievement.description}
          </Text>
          {!achievement.is_unlocked && achievement.progress !== undefined ? (
            <View style={{ marginTop: theme.spacing.sm }}>
              <View
                style={{
                  height: 8,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.color.role.primarySoft,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${achievement.progress}%`,
                    backgroundColor: theme.color.role.primary,
                  }}
                />
              </View>
              <Text
                style={{
                  marginTop: 4,
                  color: theme.color.role.textMuted,
                  fontFamily: theme.type.family.body,
                  fontSize: theme.type.sizes.xs,
                }}
              >
                {Math.round(achievement.progress)}% complete
              </Text>
            </View>
          ) : null}
          {achievement.is_unlocked ? (
            <Text style={{ marginTop: 6, color: theme.color.role.primary, fontFamily: theme.type.family.body, fontSize: theme.type.sizes.xs }}>
              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

export default function AchievementsScreen() {
  const { theme } = useAppTheme();
  const { achievements, loading, refresh } = useAchievements();

  const unlocked = achievements.filter((a) => a.is_unlocked);
  const locked = achievements.filter((a) => !a.is_unlocked);

  return (
    <AppScreen
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[theme.color.role.primary]} />}
      contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 50 }}
    >
      <GradientHeader
        title="Achievements"
        subtitle={`${unlocked.length} of ${achievements.length} unlocked`}
      />

      {achievements.length === 0 ? (
        <EmptyState
          title="No achievements yet"
          subtitle="Complete matches and play with friends to unlock them."
          icon="trophy-outline"
        />
      ) : (
        <>
          {unlocked.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>
                Unlocked
              </Text>
              {unlocked.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </View>
          ) : null}
          {locked.length > 0 ? (
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={{ color: theme.color.role.textPrimary, fontFamily: theme.type.family.headingSemi }}>
                Locked
              </Text>
              {locked.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}
