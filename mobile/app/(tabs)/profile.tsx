import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../src/components/PageHeader';
import { Button } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/auth.store';
import { canManageUsers, ROLE_LABELS } from '../../src/types';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutOpen(false);
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const menu = [
    ...(canManageUsers(user?.role)
      ? [
          {
            icon: 'people-outline' as const,
            label: 'Manage Users',
            onPress: () => router.push('/users'),
          },
        ]
      : []),
    {
      icon: 'person-outline' as const,
      label: 'Personal Information',
      onPress: () => showToast('Coming in a later phase'),
    },
    {
      icon: 'settings-outline' as const,
      label: 'Preferences',
      onPress: () => showToast('Coming in a later phase'),
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Help & Support',
      onPress: () => showToast('Coming in a later phase'),
    },
  ];

  return (
    <View style={styles.root}>
      <PageHeader title="Profile" />

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatarRing}>
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${user?.email ?? 'user'}` }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <Text style={styles.meta}>
            {user?.unitNumber ? `Apt ${user.unitNumber} • ` : ''}
            {user?.role ? ROLE_LABELS[user.role] : 'Account'}
            {user?.buildingName ? ` • ${user.buildingName}` : ''}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.verified}>
            <Text style={styles.verifiedText}>Verified Account</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {menu.map((item, i) => (
            <View key={item.label}>
              <Pressable style={styles.menuRow} onPress={item.onPress}>
                <Ionicons name={item.icon} size={22} color={colors.textMuted} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.slate200} />
              </Pressable>
              {i < menu.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Pressable style={styles.logout} onPress={() => setLogoutOpen(true)}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      <Modal visible={logoutOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setLogoutOpen(false)} />
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.handle} />

            <View style={styles.confirmIconWrap}>
              <Ionicons name="log-out" size={28} color={colors.error} />
            </View>

            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalSub}>
              You’ll need to sign in again to access your building account.
            </Text>

            <View style={styles.selectedPreview}>
              <View style={styles.previewAvatar}>
                <Image
                  source={{ uri: `https://i.pravatar.cc/150?u=${user?.email ?? 'user'}` }}
                  style={styles.previewImage}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewName}>{user?.name}</Text>
                <Text style={styles.previewEmail}>{user?.email}</Text>
                <Text style={styles.previewMeta}>
                  {user?.role ? ROLE_LABELS[user.role] : 'Account'}
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setLogoutOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Log Out"
                variant="danger"
                loading={loggingOut}
                onPress={handleLogout}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  toast: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.slate800,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  toastText: { color: colors.white, fontSize: 13, fontWeight: '500', textAlign: 'center' },
  content: { padding: spacing.md, paddingBottom: 120, gap: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.primaryMuted,
    padding: 4,
    marginBottom: spacing.md,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 44 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text },
  meta: { color: colors.textSecondary, fontWeight: '500', marginTop: 4 },
  email: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  verified: {
    marginTop: spacing.md,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  verifiedText: { color: colors.success, fontWeight: '600', fontSize: 13 },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  menuLabel: { flex: 1, fontWeight: '500', color: colors.slate800, fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: '#FFE4E6',
    padding: spacing.md,
    ...shadows.sm,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontWeight: '600', color: colors.error, fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, color: colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalDismiss: { flex: 1 },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slate200,
    marginBottom: 4,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  modalSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: -4 },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
  },
  previewImage: { width: '100%', height: '100%' },
  previewName: { fontWeight: '700', color: colors.text },
  previewEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  previewMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
