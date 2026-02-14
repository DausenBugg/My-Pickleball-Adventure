import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import GlassCard from './GlassCard';
import { useAppTheme } from '../../theme';

type EmptyStateProps = {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function EmptyState({
  title,
  subtitle,
  icon = 'sparkles-outline',
}: EmptyStateProps) {
  const { theme } = useAppTheme();

  return (
    <GlassCard style={{ alignItems: 'center', gap: 8, paddingVertical: theme.spacing.xl }}>
      <Ionicons name={icon} size={26} color={theme.color.role.primary} />
      <Text
        style={{
          color: theme.color.role.textPrimary,
          fontSize: theme.type.sizes.md,
          fontFamily: theme.type.family.headingSemi,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.color.role.textMuted,
          fontSize: theme.type.sizes.sm,
          fontFamily: theme.type.family.body,
          textAlign: 'center',
          lineHeight: theme.type.lineHeights.sm,
        }}
      >
        {subtitle}
      </Text>
    </GlassCard>
  );
}
