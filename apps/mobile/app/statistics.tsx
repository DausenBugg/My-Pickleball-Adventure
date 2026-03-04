import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';

import AnimatedPressable from '../src/components/AnimatedPressable';
import AdBanner from '../src/components/AdBanner';
import { AD_UNIT_IDS } from '../src/lib/adUnitIds';
import { useStatistics, TimePeriod } from '../src/hooks/useStatistics';
import { LEAGUES } from '../src/lib/leagues';
import { useTheme } from '../src/theme';
import { radii, shadows, spacing, typography } from '../src/theme/tokens';

const PERIOD_OPTIONS: { label: string; value: TimePeriod }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'All', value: 'all' },
];

export default function StatisticsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<TimePeriod>('all');
  const { stats, loading, error, refresh } = useStatistics(period);

  const ratingChartData =
    stats?.ratingHistory.map((point) => ({
      value: point.value,
      label: '',
      dataPointText: '',
    })) ?? [];

  // Dynamic Y-axis range: starts at the first data point, ends at current + 100
  const ratingYMin =
    ratingChartData.length > 0
      ? Math.min(...ratingChartData.map((d) => d.value))
      : 0;
  const ratingYMax =
    ratingChartData.length > 0
      ? ratingChartData[ratingChartData.length - 1].value + 100
      : 2100;
  // Floor the offset to a nice round number so labels are clean
  const ratingYOffset = Math.max(0, Math.floor(ratingYMin / 50) * 50);
  const ratingYRange = Math.max(100, ratingYMax - ratingYOffset);

  const gamesPerWeekData =
    stats?.gamesPerWeek.map((item) => ({
      value: item.count,
      label: item.week,
      frontColor: colors.primary,
    })) ?? [];

  const modeBreakdownData = stats
    ? [
        {
          value: stats.modeBreakdown.ranked,
          color: colors.secondary,
          text: `${stats.modeBreakdown.ranked}`,
          label: 'Ranked',
        },
        {
          value: stats.modeBreakdown.casual,
          color: colors.primary,
          text: `${stats.modeBreakdown.casual}`,
          label: 'Casual',
        },
      ]
    : [];

  const typeBreakdownData = stats
    ? [
        {
          value: stats.typeBreakdown.singles,
          color: colors.success,
          text: `${stats.typeBreakdown.singles}`,
          label: 'Singles',
        },
        {
          value: stats.typeBreakdown.doubles,
          color: colors.warning,
          text: `${stats.typeBreakdown.doubles}`,
          label: 'Doubles',
        },
      ]
    : [];

  // Find selected period win rate
  const periodWinRate = stats?.winRateByPeriod.find(
    (w) => w.period === period
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </AnimatedPressable>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Statistics</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && !stats ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading stats...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.secondary} />
          <Text style={[styles.errorText, { color: colors.secondary }]}>
            {error}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* ── Period toggle ── */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.periodRow}>
            {PERIOD_OPTIONS.map((opt) => (
              <AnimatedPressable
                key={opt.value}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor:
                      period === opt.value ? colors.primary : colors.borderLight,
                    borderColor:
                      period === opt.value ? colors.primary : colors.borderLight,
                  },
                ]}
                onPress={() => setPeriod(opt.value)}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: period === opt.value ? '#ffffff' : colors.muted,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </AnimatedPressable>
            ))}
          </Animated.View>

          {/* ── Overview cards ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.overviewGrid}>
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.overviewValue, { color: colors.primary }]}>
                  {stats?.totalGames ?? 0}
                </Text>
                <Text style={[styles.overviewLabel, { color: colors.muted }]}>
                  Total Games
                </Text>
              </View>
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.overviewValue, { color: colors.success }]}>
                  {periodWinRate?.winRate ?? stats?.overallWinRate ?? 0}%
                </Text>
                <Text style={[styles.overviewLabel, { color: colors.muted }]}>
                  Win Rate
                </Text>
              </View>
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.overviewValue, { color: colors.warning }]}>
                  {stats?.bestStreak ?? 0}
                </Text>
                <Text style={[styles.overviewLabel, { color: colors.muted }]}>
                  Best Streak
                </Text>
              </View>
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <Text style={[styles.overviewValue, { color: colors.ink }]}>
                  {stats?.currentStreak ?? 0}
                </Text>
                <Text style={[styles.overviewLabel, { color: colors.muted }]}>
                  Current Streak
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Ad banner ── */}
          <AdBanner adUnitId={AD_UNIT_IDS.STATISTICS_BANNER} />

          {/* ── Rating Over Time ── */}
          {ratingChartData.length > 1 && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Rating Over Time
                </Text>
              </View>
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <LineChart
                  data={ratingChartData}
                  width={280}
                  height={180}
                  color={colors.primary}
                  thickness={2}
                  startFillColor={colors.primaryGhost}
                  endFillColor="transparent"
                  areaChart
                  curved
                  hideDataPoints={ratingChartData.length > 20}
                  dataPointsColor={colors.primary}
                  dataPointsRadius={3}
                  xAxisColor={colors.borderLight}
                  yAxisColor={colors.borderLight}
                  yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
                  rulesColor={colors.borderLight}
                  rulesType="dashed"
                  noOfSections={4}
                  maxValue={ratingYRange}
                  yAxisOffset={ratingYOffset}
                  isAnimated
                  animationDuration={800}
                />
              </View>
            </Animated.View>
          )}

          {/* ── Win Rate by Period ── */}
          {stats && stats.winRateByPeriod.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={18} color={colors.success} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Win Rate Breakdown
                </Text>
              </View>
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                {stats.winRateByPeriod.map((wr) => (
                  <View key={wr.period} style={styles.winRateRow}>
                    <Text style={[styles.winRateLabel, { color: colors.ink }]}>
                      {wr.label}
                    </Text>
                    <View style={styles.winRateBarContainer}>
                      <View
                        style={[
                          styles.winRateBarFill,
                          {
                            width: `${Math.max(wr.winRate, 2)}%`,
                            backgroundColor:
                              wr.winRate >= 60
                                ? colors.success
                                : wr.winRate >= 40
                                ? colors.warning
                                : colors.error,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.winRateValue, { color: colors.ink }]}>
                      {wr.winRate}%
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Games Per Week ── */}
          {gamesPerWeekData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bar-chart" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Games Per Week
                </Text>
              </View>
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <BarChart
                  data={gamesPerWeekData}
                  width={280}
                  height={150}
                  barWidth={24}
                  spacing={16}
                  roundedTop
                  roundedBottom
                  xAxisColor={colors.borderLight}
                  yAxisColor={colors.borderLight}
                  yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: colors.muted, fontSize: 9 }}
                  rulesColor={colors.borderLight}
                  noOfSections={4}
                  isAnimated
                />
              </View>
            </Animated.View>
          )}

          {/* ── Match Breakdown (Pie Charts) ── */}
          {stats && stats.totalGames > 0 && (
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pie-chart" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                  Match Breakdown
                </Text>
              </View>
              <View style={styles.pieRow}>
                {/* Mode breakdown */}
                <View
                  style={[
                    styles.pieCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[styles.pieTitle, { color: colors.ink }]}>Mode</Text>
                  {(stats.modeBreakdown.ranked > 0 || stats.modeBreakdown.casual > 0) ? (
                    <>
                      <PieChart
                        data={modeBreakdownData}
                        radius={50}
                        innerRadius={30}
                        donut
                        centerLabelComponent={() => (
                          <Text style={[styles.pieCenterText, { color: colors.blue }]}>
                            {stats.totalGames}
                          </Text>
                        )}
                      />
                      <View style={styles.pieLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                          <Text style={[styles.legendText, { color: colors.muted }]}>
                            Ranked ({stats.modeBreakdown.ranked})
                          </Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                          <Text style={[styles.legendText, { color: colors.muted }]}>
                            Casual ({stats.modeBreakdown.casual})
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.emptyChartText, { color: colors.muted }]}>No data</Text>
                  )}
                </View>

                {/* Type breakdown */}
                <View
                  style={[
                    styles.pieCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.borderLight,
                    },
                  ]}
                >
                  <Text style={[styles.pieTitle, { color: colors.ink }]}>Type</Text>
                  {(stats.typeBreakdown.singles > 0 || stats.typeBreakdown.doubles > 0) ? (
                    <>
                      <PieChart
                        data={typeBreakdownData}
                        radius={50}
                        innerRadius={30}
                        donut
                        centerLabelComponent={() => (
                          <Text style={[styles.pieCenterText, { color: colors.blue }]}>
                            {stats.totalGames}
                          </Text>
                        )}
                      />
                      <View style={styles.pieLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                          <Text style={[styles.legendText, { color: colors.muted }]}>
                            Singles ({stats.typeBreakdown.singles})
                          </Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                          <Text style={[styles.legendText, { color: colors.muted }]}>
                            Doubles ({stats.typeBreakdown.doubles})
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.emptyChartText, { color: colors.muted }]}>No data</Text>
                  )}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Empty state */}
          {stats && stats.totalGames === 0 && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyContainer}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>No stats yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                Play some matches to start tracking your performance!
              </Text>
            </Animated.View>
          )}

          {/* Spacer for floating tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },

  // Period toggle
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  periodText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  // Overview
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  overviewValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  overviewLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  chartCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    ...shadows.sm,
  },

  // Win Rate Bars
  winRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    width: '100%',
  },
  winRateLabel: {
    flex: 0.3,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  winRateBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.15)',
    overflow: 'hidden',
  },
  winRateBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  winRateValue: {
    width: 40,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textAlign: 'right',
  },

  // Pie charts
  pieRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pieCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pieTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pieCenterText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  pieLegend: {
    gap: 4,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: typography.sizes.xs,
  },
  emptyChartText: {
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.lg,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
