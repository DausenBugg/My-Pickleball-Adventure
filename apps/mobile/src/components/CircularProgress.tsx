import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { typography } from '../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  /** 0‑100 */
  progress: number;
  /** Diameter of the ring */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Ring color */
  progressColor: string;
  /** Track (background) ring color */
  trackColor: string;
  /** Big number shown in the center */
  centerLabel: string;
  /** Small line below the number */
  centerSub?: string;
  /** Extra small line below sub */
  centerHint?: string;
  /** Text colors */
  labelColor: string;
  subColor: string;
}

export default function CircularProgress({
  progress,
  size = 180,
  strokeWidth = 12,
  progressColor,
  trackColor,
  centerLabel,
  centerSub,
  centerHint,
  labelColor,
  subColor,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      200,
      withTiming(Math.min(Math.max(progress, 0), 100), { duration: 900 }),
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      circumference - (circumference * animatedProgress.value) / 100,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.centerLabel,
            { color: labelColor },
          ]}
        >
          {centerLabel}
        </Text>
        {centerSub ? (
          <Text style={[styles.centerSub, { color: subColor }]}>
            {centerSub}
          </Text>
        ) : null}
        {centerHint ? (
          <Text style={[styles.centerHint, { color: subColor }]}>
            {centerHint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.heavy,
  },
  centerSub: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  centerHint: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
});
