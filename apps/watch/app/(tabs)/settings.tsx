import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/state/auth';
import { watchColors } from '../../src/theme/colors';
import { watchSizing } from '../../src/theme/sizing';

export default function SettingsScreen() {
  const { session } = useAuth();

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentWrap}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.email} numberOfLines={1}>
            {session?.user?.email || 'Not signed in'}
          </Text>

          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: watchColors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: watchSizing.pageHorizontal,
    paddingVertical: watchSizing.pageGap,
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    gap: watchSizing.pageGap,
  },
  pageTitle: {
    color: watchColors.text,
    fontSize: watchSizing.title,
    fontWeight: '700',
  },
  email: {
    color: watchColors.muted,
    fontSize: watchSizing.subtitle,
    maxWidth: '100%',
  },
  signOutBtn: {
    width: '100%',
    minHeight: watchSizing.buttonHeight,
    borderRadius: watchSizing.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: watchColors.secondary,
    marginTop: 2,
  },
  signOutText: {
    color: watchColors.textOnPrimary,
    fontSize: watchSizing.bodyStrong,
    fontWeight: '700',
  },
});