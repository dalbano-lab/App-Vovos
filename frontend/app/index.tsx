import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/src/api';
import { colors } from '@/src/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.getProfile();
        if (cancelled) return;
        if (profile && profile.called_as) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        if (!cancelled) router.replace('/onboarding');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container} testID="loading-screen">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
