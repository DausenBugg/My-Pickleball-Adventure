import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const CONFETTI_COLORS = [
  '#ffd700', // gold
  '#ff4538', // coral / red
  '#1a73e8', // blue
  '#4caf50', // green
  '#ff9800', // orange
  '#e040fb', // pink/purple
  '#00bcd4', // teal
  '#ffffff', // white
];

const PARTICLE_COUNT = 28;

interface Particle {
  id: number;
  color: string;
  /** Angle in radians from center */
  angle: number;
  /** Distance to travel */
  distance: number;
  /** Delay before this particle starts (ms) */
  delay: number;
  /** Size of particle */
  size: number;
  /** Rotation degrees */
  rotation: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    angle: (i / PARTICLE_COUNT) * 2 * Math.PI + (Math.random() - 0.5) * 0.4,
    distance: 80 + Math.random() * 100,
    delay: Math.random() * 200,
    size: 5 + Math.random() * 5,
    rotation: Math.random() * 360,
  }));
}

interface ConfettiParticleProps {
  particle: Particle;
  playing: boolean;
}

function ConfettiParticle({ particle, playing }: ConfettiParticleProps) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      opacity.value = withDelay(
        particle.delay,
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(600, withTiming(0, { duration: 400 })),
        ),
      );
      progress.value = withDelay(
        particle.delay,
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      progress.value = 0;
      opacity.value = 0;
    }
  }, [playing]);

  const animatedStyle = useAnimatedStyle(() => {
    const x = Math.cos(particle.angle) * particle.distance * progress.value;
    // Gravity: pull down as progress increases
    const gravity = 120 * progress.value * progress.value;
    const y =
      Math.sin(particle.angle) * particle.distance * progress.value + gravity;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${particle.rotation * progress.value}deg` },
        { scale: 1 - progress.value * 0.4 },
      ],
    };
  });

  const isWide = particle.id % 3 === 0;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: isWide ? particle.size * 1.8 : particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: isWide ? 2 : particle.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiBurstProps {
  /** Set to true to play the burst */
  playing: boolean;
  /** Called when the animation finishes */
  onComplete?: () => void;
}

export default function ConfettiBurst({ playing, onComplete }: ConfettiBurstProps) {
  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    if (playing && onComplete) {
      const timer = setTimeout(() => onComplete(), 1400);
      return () => clearTimeout(timer);
    }
  }, [playing, onComplete]);

  if (!playing) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} particle={p} playing={playing} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
  },
});
