import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/stores/auth.store';
import { colors } from '../src/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/overview');
    }
  }, [isAuthenticated, isHydrated, segments, router]);

  return (
    <View style={styles.gate}>
      {children}
      {!isHydrated ? (
        <View style={styles.boot}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

function StatusBarBackdrop() {
  const insets = useSafeAreaInsets();
  return <View pointerEvents="none" style={[styles.statusBarBackdrop, { height: insets.top }]} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.shell}>
      <SafeAreaProvider style={styles.shell}>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="building/[id]" />
          </Stack>
        </AuthGate>
        <StatusBarBackdrop />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  gate: { flex: 1 },
  boot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    zIndex: 50,
  },
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    zIndex: 100,
  },
});
