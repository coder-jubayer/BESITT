import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../src/components/PageHeader';
import { Button, Card } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { config } from '../../src/config/env';
import { colors, spacing, borderRadius, typography } from '../../src/theme';
import { ROLE_LABELS } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLogoutOpen(false);
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Profile" />
      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Card padding="lg">
          <Text style={styles.name}>{user?.name ?? 'App Admin'}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.meta}>{ROLE_LABELS[user?.role ?? 'app_admin']}</Text>
          <Text style={styles.api}>API · {config.apiUrl}</Text>
        </Card>

        <Pressable style={styles.logout} onPress={() => setLogoutOpen(true)}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>

      <Modal visible={logoutOpen} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalBody}>You will need to sign in again to manage the platform.</Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setLogoutOpen(false)} />
              <Button title="Log Out" variant="danger" onPress={() => void handleLogout()} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  name: { ...typography.h2, color: colors.text },
  meta: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  api: { ...typography.caption, color: colors.textMuted, marginTop: 12 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontWeight: '600', color: colors.error, fontSize: 15 },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { ...typography.h2, color: colors.text },
  modalBody: { ...typography.body, color: colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
});
