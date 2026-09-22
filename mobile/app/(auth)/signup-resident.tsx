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
import { lookupBuildingCode } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, typography, borderRadius } from '../../src/theme';

const CODE_LENGTH = 6;

export default function ResidentSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signupAsResident, isAuthenticated, isLoading, isHydrated } = useAuthStore();

  const [buildingCode, setBuildingCode] = useState('');
  const [name, setName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [buildingName, setBuildingName] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (buildingCode.length < CODE_LENGTH) {
      setBuildingName(null);
      setCodeError(null);
      return;
    }

    let cancelled = false;
    lookupBuildingCode(buildingCode)
      .then((building) => {
        if (cancelled) return;
        setBuildingName(building.name);
        setCodeError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setBuildingName(null);
        setCodeError('No building found for that code');
      });

    return () => {
      cancelled = true;
    };
  }, [buildingCode]);

  if (isHydrated && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  const handleSignup = async () => {
    if (!buildingCode.trim() || !name.trim() || !unitNumber.trim() || !phone.trim() || !password) {
      setError('Building code, name, unit, phone, and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    try {
      await signupAsResident({
        buildingCode: buildingCode.trim(),
        name: name.trim(),
        unitNumber: unitNumber.trim(),
        phone: phone.trim(),
        password,
        email: email.trim() || undefined,
      });
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          accessibilityLabel="Barighorr"
        />
        <Text style={styles.appName}>Resident</Text>
        <Text style={styles.tagline}>Join your building with its code</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.formWrap, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <View style={styles.form}>
            <Input
              label="Building code"
              placeholder="6-character code"
              value={buildingCode}
              onChangeText={(value) => {
                setBuildingCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH));
                setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODE_LENGTH}
              style={styles.codeInput}
              error={codeError ?? undefined}
              hint={
                buildingName
                  ? `Joining ${buildingName}`
                  : 'Ask your building admin for this code'
              }
            />
            <Input
              label="Full name"
              placeholder="Your name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError(null);
              }}
            />
            <Input
              label="Unit / Apartment"
              placeholder="A-402"
              value={unitNumber}
              onChangeText={(value) => {
                setUnitNumber(value);
                setError(null);
              }}
              autoCapitalize="characters"
            />
            <Input
              label="Phone"
              placeholder="+880..."
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setError(null);
              }}
              keyboardType="phone-pad"
              autoCorrect={false}
              hint="You can sign in with this number"
            />
            <Input
              label="Email (optional)"
              placeholder="you@email.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Password"
              placeholder="Min 6 characters"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError(null);
              }}
              secureTextEntry
            />
            <Input
              label="Confirm password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setError(null);
              }}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Create Account" fullWidth loading={isLoading} onPress={handleSignup} />
          </View>
        </Card>

        <Pressable onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.switchText}>
            Wrong role? <Text style={styles.switchLink}>Choose again</Text>
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  formWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.xl,
  },
  appName: { ...typography.h2, color: colors.text },
  tagline: { ...typography.bodySmall, color: colors.textSecondary },
  form: { gap: spacing.md },
  codeInput: { letterSpacing: 4, fontWeight: '700' },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  switchText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
