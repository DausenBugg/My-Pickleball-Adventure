import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppScreen, GlassCard, GradientHeader, PrimaryButton } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme';

const ONBOARDING_STEPS = [
  {
    title: 'Track Every Rally',
    body: 'Log singles and doubles matches in seconds with a cleaner, faster workflow.',
    icon: 'tennisball-outline',
  },
  {
    title: 'Level Up Your Game',
    body: 'Earn XP, monitor your rating, and spot momentum through modern performance insights.',
    icon: 'trending-up-outline',
  },
  {
    title: 'Compete With Friends',
    body: 'Discover players, compare rankings, and stay synced with approvals and notifications.',
    icon: 'people-outline',
  },
] as const;

export default function WelcomeScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const active = ONBOARDING_STEPS[step];
  const isLastStep = step === ONBOARDING_STEPS.length - 1;

  return (
    <AppScreen scrollable={false}>
      <View style={styles.layout}>
        <GradientHeader
          title="My Pickleball Adventure"
          subtitle="Modern match tracking for players who want to improve and compete."
        />

        <GlassCard style={{ gap: theme.spacing.md }}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: theme.color.role.primarySoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Ionicons name={active.icon} size={28} color={theme.color.role.primary} />
          </View>

          <Text
            style={{
              color: theme.color.role.textPrimary,
              fontSize: theme.type.sizes.lg,
              fontFamily: theme.type.family.heading,
            }}
          >
            {active.title}
          </Text>
          <Text
            style={{
              color: theme.color.role.textSecondary,
              fontSize: theme.type.sizes.base,
              lineHeight: theme.type.lineHeights.base,
              fontFamily: theme.type.family.body,
            }}
          >
            {active.body}
          </Text>

          <View style={styles.dotRow}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: index === step ? 24 : 8,
                    borderRadius: theme.radius.pill,
                    backgroundColor:
                      index === step
                        ? theme.color.role.primary
                        : theme.color.role.borderStrong,
                  },
                ]}
              />
            ))}
          </View>

          {!isLastStep ? (
            <View style={styles.stepActions}>
              <Pressable onPress={() => setStep(ONBOARDING_STEPS.length - 1)}>
                <Text
                  style={{
                    color: theme.color.role.textMuted,
                    fontSize: theme.type.sizes.sm,
                    fontFamily: theme.type.family.bodySemi,
                  }}
                >
                  Skip
                </Text>
              </Pressable>
              <PrimaryButton label="Next" secondary onPress={() => setStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1))} />
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              <PrimaryButton label="Create account" onPress={() => router.push('/(auth)/register')} />
              <PrimaryButton label="Sign in" secondary onPress={() => router.push('/(auth)/login')} />
            </View>
          )}
        </GlassCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  iconWrap: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
});
