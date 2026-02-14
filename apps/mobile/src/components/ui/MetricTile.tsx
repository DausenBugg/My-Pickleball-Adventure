import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import GlassCard from './GlassCard';
import { useAppTheme } from '../../theme';

type MetricTileProps = {
  label: string;
  value: string | number;
  accent?: 'primary' | 'secondary' | 'neutral';
  style?: StyleProp<ViewStyle>;
};

export default function MetricTile({ label, value, accent = 'neutral', style }: MetricTileProps) {
  const { theme } = useAppTheme();

  const valueColor =
    accent === 'primary'
      ? theme.color.role.primary
      : accent === 'secondary'
        ? theme.color.role.secondary
        : theme.color.role.textPrimary;

  return (
    <GlassCard style={style}>
      <Text
        style={{
          color: theme.color.role.textMuted,
          fontSize: theme.type.sizes.xs,
          fontFamily: theme.type.family.bodySemi,
          textTransform: 'uppercase',
          letterSpacing: 0.7,
        }}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: valueColor,
            fontSize: theme.type.sizes.xl,
            fontFamily: theme.type.family.heading,
          },
        ]}
      >
        {value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  value: {
    marginTop: 6,
  },
});
