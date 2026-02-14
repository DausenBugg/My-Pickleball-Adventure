import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useAppTheme } from '../../theme';

type GlassCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export default function GlassCard({ children, style, padded = true }: GlassCardProps) {
  const { theme, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: theme.color.role.border,
          borderRadius: theme.radius.lg,
        },
        theme.elevation.sm,
        style,
      ]}
    >
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={45}
        style={[
          styles.inner,
          {
            borderRadius: theme.radius.lg,
            backgroundColor: theme.color.role.surfaceGlass,
            padding: padded ? theme.spacing.md : 0,
          },
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    overflow: 'hidden',
  },
});
