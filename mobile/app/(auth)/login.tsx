import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, typography, borderRadius } from '../../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isHydrated, isAuthenticated, router]);

  if (isHydrated && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError('Enter your email or phone and password.');
      return;
    }

    setError(null);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)/home');
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
            accessibilityLabel="Barighorr"
          />
          <Text style={styles.tagline}>Sign in to continue</Text>
        </View>

        <Card>
          <View style={styles.form}>
            <Input
              label="Email or phone"
              placeholder="Enter email or phone"
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
            <Button title="Sign In" fullWidth loading={isLoading} onPress={handleLogin} />
          </View>
        </Card>

        <Pressable onPress={() => router.push('/(auth)/signup')}>
          <Text style={styles.switchText}>
            New here? <Text style={styles.switchLink}>Create an account</Text>
          </Text>
        </Pressable>
        <Text style={styles.signupHint}>Resident with a building code, or register as building admin</Text>
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
  logoContainer: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  logo: {
    width: 112,
    height: 112,
    borderRadius: borderRadius.xl,
  },
  tagline: { ...typography.bodySmall, color: colors.textSecondary },
  form: { gap: spacing.md },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  switchText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  switchLink: { color: colors.primary, fontWeight: '700' },
  signupHint: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
});
