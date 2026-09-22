import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, typography, borderRadius } from '../../src/theme';

export default function AdminLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/(tabs)/overview');
    }
  }, [isHydrated, isAuthenticated, router]);

  if (isHydrated && isAuthenticated) {
    return <Redirect href="/(tabs)/overview" />;
  }

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            accessibilityLabel="Barighorr Admin"
          />
          <Text style={styles.title}>Barighorr Admin</Text>
          <Text style={styles.tagline}>Platform console for app admins</Text>
        </View>

        <Card>
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="admin@example.com"
              value={identifier}
              onChangeText={(value) => {
                setIdentifier(value);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError(null);
              }}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Sign In" fullWidth loading={isLoading} onPress={() => void handleLogin()} />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  logoContainer: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  logo: { width: 112, height: 112, borderRadius: borderRadius.xl },
  title: { ...typography.h2, color: colors.text },
  tagline: { ...typography.bodySmall, color: colors.textSecondary },
  form: { gap: spacing.md },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
});
