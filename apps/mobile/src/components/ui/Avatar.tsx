import { Image, Text, View } from 'react-native';

import { useAppTheme } from '../../theme';

type AvatarProps = {
  uri?: string | null;
  name: string;
  size?: number;
};

export default function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const { theme } = useAppTheme();
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: theme.color.role.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontFamily: theme.type.family.headingSemi,
          fontSize: Math.max(12, size * 0.34),
        }}
      >
        {name[0]?.toUpperCase() || 'P'}
      </Text>
    </View>
  );
}
