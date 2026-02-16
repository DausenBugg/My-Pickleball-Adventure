declare module '@expo/vector-icons' {
  export * from '@expo/vector-icons/build/Icons';
}

declare module '@expo/vector-icons/build/Icons' {
  import { ComponentType } from 'react';
  import { TextStyle } from 'react-native';

  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  export const Ionicons: ComponentType<IconProps>;
  export const MaterialIcons: ComponentType<IconProps>;
  export const FontAwesome: ComponentType<IconProps>;
  export const Feather: ComponentType<IconProps>;
  export const AntDesign: ComponentType<IconProps>;
  export const Entypo: ComponentType<IconProps>;
  export const EvilIcons: ComponentType<IconProps>;
  export const Foundation: ComponentType<IconProps>;
  export const MaterialCommunityIcons: ComponentType<IconProps>;
  export const Octicons: ComponentType<IconProps>;
  export const SimpleLineIcons: ComponentType<IconProps>;
  export const Zocial: ComponentType<IconProps>;
}
