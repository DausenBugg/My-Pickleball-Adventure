import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useAppTheme } from '../../theme';

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badgeCount?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
};

export default function IconButton({
  icon,
  onPress,
  badgeCount,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: 44,
          height: 44,
          borderRadius: theme.radius.pill,
          borderColor: theme.color.role.border,
          backgroundColor: theme.color.role.surface,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={theme.color.role.textPrimary} />
      {badgeCount && badgeCount > 0 ? (
        <Pressable
          pointerEvents="none"
          style={[
            styles.badge,
            {
              backgroundColor: theme.color.role.secondary,
              borderRadius: theme.radius.pill,
            },
          ]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
  },
});
