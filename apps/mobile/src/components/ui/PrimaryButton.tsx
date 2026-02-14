import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../../theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: ReactNode;
};

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  secondary,
  style,
  leftIcon,
}: PrimaryButtonProps) {
  const { theme } = useAppTheme();

  const backgroundColor = secondary ? theme.color.role.primary : theme.color.role.secondary;
  const disabledColor = secondary ? theme.color.role.primarySoft : theme.color.role.secondarySoft;

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: 46,
          borderRadius: theme.radius.md,
          backgroundColor: disabled || loading ? disabledColor : backgroundColor,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.text,
              {
                fontSize: theme.type.sizes.base,
                fontFamily: theme.type.family.bodySemi,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  text: {
    color: '#FFFFFF',
  },
});
