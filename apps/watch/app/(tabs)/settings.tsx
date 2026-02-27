import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/state/auth';
import { watchColors } from '../../src/theme/colors';

export default function SettingsScreen() {
  const { session } = useAuth();

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.email} numberOfLines={1}>
          {session?.user?.email || 'Not signed in'}
        </Text>

        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: watchColors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    color: watchColors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: watchColors.muted,
    fontSize: 12,
    maxWidth: '100%',
  },
  signOutBtn: {
    width: '100%',
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: watchColors.secondary,
    marginTop: 6,
  },
  signOutText: {
    color: watchColors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});