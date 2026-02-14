import { ReactNode } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../../theme';

type BaseProps = {
  children: ReactNode;
  padded?: boolean;
  scrollable?: boolean;
};

type AppScreenProps = BaseProps &
  Pick<ViewProps, 'style'> &
  Pick<ScrollViewProps, 'contentContainerStyle' | 'refreshControl'>;

export default function AppScreen({
  children,
  padded = true,
  scrollable = true,
  style,
  contentContainerStyle,
  refreshControl,
}: AppScreenProps) {
  const { theme, isDark } = useAppTheme();

  const gradient = isDark
    ? (['#071827', '#0A2034', '#0D2941'] as const)
    : (['#EAF6FD', '#DFF1FC', '#F5FAFF'] as const);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.color.role.background }, style]}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              padded && { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: 40 },
              contentContainerStyle,
            ]}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              padded && { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.lg },
              contentContainerStyle,
            ]}
          >
            {children}
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
  },
  content: {
    flex: 1,
    gap: 16,
  },
});
