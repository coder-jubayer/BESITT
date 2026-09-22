import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';

export default function SignupRoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isHydrated, isAuthenticated, router]);

  if (isHydrated && isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          accessibilityLabel="Barighorr"
        />
        <Text style={styles.appName}>Create an account</Text>
        <Text style={styles.tagline}>Choose how you want to join Barighorr</Text>
      </View>

      <View style={styles.choices}>
        <Pressable
          style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
          onPress={() => router.push('/(auth)/signup-resident')}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="home-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>Resident</Text>
            <Text style={styles.choiceDesc}>Join an existing building with a code</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.slate200} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
          onPress={() => router.push('/(auth)/signup-admin')}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="business-outline" size={28} color={colors.success} />
          </View>
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>Building Admin</Text>
            <Text style={styles.choiceDesc}>Register a new building and get a join code</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.slate200} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.switchLink}>Sign in</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
  },
  appName: { ...typography.h2, color: colors.text },
  tagline: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  choices: { gap: spacing.md },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  choicePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCopy: { flex: 1, gap: 2 },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  choiceDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  switchText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
