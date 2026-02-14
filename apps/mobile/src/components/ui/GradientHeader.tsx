import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../../theme';

type GradientHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function GradientHeader({ title, subtitle, right, style }: GradientHeaderProps) {
  const { theme, isDark } = useAppTheme();
  const colors = isDark
    ? (['rgba(56, 189, 248, 0.28)', 'rgba(255, 127, 106, 0.18)'] as const)
    : (['rgba(56, 189, 248, 0.24)', 'rgba(255, 127, 106, 0.2)'] as const);

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.xl,
          borderColor: theme.color.role.borderStrong,
          padding: theme.spacing.lg,
        },
        style,
      ]}
    >
      <View style={styles.textWrap}>
        <Text
          style={[
            styles.title,
            {
              color: theme.color.role.textPrimary,
              fontFamily: theme.type.family.heading,
              fontSize: theme.type.sizes.lg,
            },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.color.role.textSecondary,
                fontFamily: theme.type.family.body,
                fontSize: theme.type.sizes.base,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    includeFontPadding: false,
  },
  subtitle: {
    includeFontPadding: false,
  },
});
