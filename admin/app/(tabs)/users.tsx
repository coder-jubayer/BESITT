import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../src/components/PageHeader';
import { Button, Input } from '../../src/components/ui';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { fetchUsers, setUserActive } from '../../src/services/users.service';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors, spacing, borderRadius, shadows, typography } from '../../src/theme';
import { ROLE_LABELS, type User } from '../../src/types';

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2400);
  };

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      if (!opts?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useAutoRefresh(() => load({ silent: true }), 8000);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.name} ${u.email ?? ''} ${u.phone ?? ''} ${u.buildingName ?? ''} ${u.unitNumber ?? ''} ${u.role}`
        .toLowerCase()
        .includes(q),
    );
  }, [query, users]);

  const handleToggle = async () => {
    if (!confirm) return;
    const next = !(confirm.isActive ?? true);
    setBusyId(confirm.id);
    try {
      await setUserActive(confirm.id, next);
      setConfirm(null);
      await load();
      showToast(next ? 'User activated' : 'User deactivated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.root}>
      <PageHeader title="Users">
        <Input
          placeholder="Search name, email, phone, building"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </PageHeader>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && filtered.length === 0 ? (
          <Text style={styles.empty}>No users found</Text>
        ) : null}

        {filtered.map((user) => {
          const active = user.isActive ?? true;
          const isSelf = user.id === me?.id;
          return (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.meta}>{ROLE_LABELS[user.role] ?? user.role}</Text>
                  <Text style={styles.meta}>
                    {user.email || user.phone || 'No contact'}
                    {user.buildingName ? ` · ${user.buildingName}` : ''}
                    {user.unitNumber ? ` · Unit ${user.unitNumber}` : ''}
                  </Text>
                </View>
                <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
                  <Text style={[styles.badgeText, active ? styles.badgeOnText : styles.badgeOffText]}>
                    {active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              {!isSelf ? (
                <Pressable
                  style={[styles.action, active ? styles.actionOff : styles.actionOn]}
                  onPress={() => setConfirm(user)}
                  disabled={busyId === user.id}
                >
                  {busyId === user.id ? (
                    <ActivityIndicator size="small" color={active ? colors.error : colors.success} />
                  ) : (
                    <Text
                      style={[
                        styles.actionText,
                        { color: active ? colors.error : colors.success },
                      ]}
                    >
                      {active ? 'Deactivate user' : 'Activate user'}
                    </Text>
                  )}
                </Pressable>
              ) : (
                <Text style={styles.selfNote}>This is your account</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={Boolean(confirm)} transparent animationType="fade">
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {(confirm?.isActive ?? true) ? 'Deactivate user?' : 'Activate user?'}
            </Text>
            <Text style={styles.modalBody}>
              {(confirm?.isActive ?? true)
                ? `${confirm?.name} will not be able to sign in until activated again.`
                : `${confirm?.name} will be able to sign in again.`}
            </Text>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setConfirm(null)} />
              <Button
                title={(confirm?.isActive ?? true) ? 'Deactivate' : 'Activate'}
                variant={(confirm?.isActive ?? true) ? 'danger' : 'primary'}
                loading={Boolean(busyId)}
                onPress={() => void handleToggle()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', marginBottom: 12 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  badgeOn: { backgroundColor: colors.successLight },
  badgeOff: { backgroundColor: colors.errorLight },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  badgeOnText: { color: colors.success },
  badgeOffText: { color: colors.error },
  action: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionOff: { backgroundColor: colors.errorLight, borderColor: '#FECDD3' },
  actionOn: { backgroundColor: colors.successLight, borderColor: '#A7F3D0' },
  actionText: { fontWeight: '600', fontSize: 14 },
  selfNote: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 32 },
  error: { color: colors.error, textAlign: 'center' },
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
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  toastText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
