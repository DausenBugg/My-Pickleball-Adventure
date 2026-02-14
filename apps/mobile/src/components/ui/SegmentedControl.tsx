import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../theme';

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.role.primarySoft,
          borderColor: theme.color.role.border,
        },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              {
                minHeight: 44,
                borderRadius: theme.radius.sm,
                backgroundColor: active ? theme.color.role.surface : 'transparent',
              },
            ]}
          >
            <Text
              style={{
                color: active ? theme.color.role.textPrimary : theme.color.role.textMuted,
                fontSize: theme.type.sizes.sm,
                fontFamily: theme.type.family.bodySemi,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
    gap: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
