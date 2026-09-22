import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../../src/components/PageHeader';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';
import { useAuthStore } from '../../src/stores/auth.store';
import { decideGuestVisit, fetchGuests } from '../../src/services/guests.service';
import { formatRelativeTime } from '../../src/utils/date';
import { useGuestsStore } from '../../src/stores/guests.store';
import {
  Building,
  GuestVisit,
  canCreateGuestVisits,
  isAppAdmin,
} from '../../src/types';

export default function GuestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const creator = canCreateGuestVisits(user?.role);
  const appAdmin = isAppAdmin(user?.role);

  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [visits, setVisits] = useState<GuestVisit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [canCreate, setCanCreate] = useState(creator);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = visits.filter((item) => item.status === 'pending');
  const history = visits.filter((item) => item.status !== 'pending');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const loadGuests = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchGuests(appAdmin ? buildingId || undefined : undefined);
      setVisits(data.visits);
      setCanCreate(data.canCreate);
      setBuildings(data.buildings ?? []);
      setBuildingId((current) => current || data.buildingId || data.buildings?.[0]?.id || '');
      useGuestsStore.getState().sync(data.visits, Boolean(data.canDecide));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appAdmin, buildingId]);

  useFocusEffect(
    useCallback(() => {
      void loadGuests();
    }, [loadGuests]),
  );

  const handleDecide = async (visit: GuestVisit, status: 'approved' | 'denied') => {
    setBusyId(visit.id);
    try {
      await decideGuestVisit(visit.id, status);
      await loadGuests();
      showToast(status === 'approved' ? 'Visitor approved' : 'Visitor denied');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const callPhone = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`);
    } catch {
      showToast(phone);
    }
  };

  const list = tab === 'pending' ? pending : history;

  return (
    <View style={styles.root}>
      <PageHeader title="Guest Approvals">
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, tab === 'pending' && styles.tabActive]}
            onPress={() => setTab('pending')}
          >
            <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
              {canCreate ? 'Waiting' : 'Pending'} ({pending.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History</Text>
          </Pressable>
        </View>
      </PageHeader>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (canCreate ? 120 : 40) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadGuests();
            }}
          />
        }
      >
        {appAdmin && buildings.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {buildings.map((building) => (
              <Pressable
                key={building.id}
                onPress={() => setBuildingId(building.id)}
                style={[styles.chip, buildingId === building.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, buildingId === building.id && styles.chipTextActive]}>
                  {building.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && list.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              {tab === 'pending'
                ? canCreate
                  ? 'No visitors waiting on a resident'
                  : 'No pending approvals'
                : 'No guest history yet'}
            </Text>
          </View>
        ) : null}

        {list.map((visit) => (
          <View key={visit.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.guestName}>{visit.visitorName}</Text>
                <Text style={styles.guestTime}>
                  {formatRelativeTime(visit.createdAt)}
                  {visit.createdByName ? ` · ${visit.createdByName}` : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  visit.status === 'pending' && styles.waitingBadge,
                  visit.status === 'approved' && { backgroundColor: colors.successLight },
                  visit.status === 'denied' && { backgroundColor: colors.errorLight },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    visit.status === 'pending' && styles.waitingText,
                    visit.status === 'approved' && { color: colors.success },
                    visit.status === 'denied' && { color: colors.error },
                  ]}
                >
                  {visit.status === 'pending' ? 'Waiting' : visit.status}
                </Text>
              </View>
            </View>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Purpose</Text>
                <Text style={styles.metaValue}>{visit.purpose}</Text>
              </View>
              <Pressable style={styles.metaRow} onPress={() => void callPhone(visit.visitorPhone)}>
                <Text style={styles.metaLabel}>Phone</Text>
                <Text style={[styles.metaValue, { color: colors.primary }]}>{visit.visitorPhone}</Text>
              </Pressable>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Resident</Text>
                <Text style={styles.metaValue}>
                  {visit.residentName}
                  {visit.unitNumber ? ` · Apt ${visit.unitNumber}` : ''}
                </Text>
              </View>
            </View>
            {visit.canDecide ? (
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, styles.allowBtn]}
                  onPress={() => void handleDecide(visit, 'approved')}
                  disabled={busyId === visit.id}
                >
                  {busyId === visit.id ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color={colors.success} />
                      <Text style={[styles.actionText, { color: colors.success }]}>Allow</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, styles.denyBtn]}
                  onPress={() => void handleDecide(visit, 'denied')}
                  disabled={busyId === visit.id}
                >
                  <Ionicons name="close" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Deny</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {canCreate ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 88 }]}
          onPress={() =>
            router.push({
              pathname: '/add-visitor',
              params: buildingId ? { buildingId } : {},
            } as never)
          }
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      ) : null}

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + (canCreate ? 160 : 24) }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.md,
    padding: 4,
    marginTop: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.white, ...shadows.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.text },
  list: { padding: spacing.md, gap: spacing.md },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  chipActive: { backgroundColor: colors.slate800 },
  chipText: { fontWeight: '600', fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.white },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  guestName: { fontSize: 18, fontWeight: '700', color: colors.text },
  guestTime: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  waitingBadge: { backgroundColor: '#FEF3C7' },
  waitingText: { color: '#B45309' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 6,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metaLabel: { fontSize: 13, color: colors.textSecondary },
  metaValue: { fontSize: 13, fontWeight: '500', color: colors.slate800, flexShrink: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  allowBtn: { backgroundColor: colors.successLight, borderColor: '#A7F3D0' },
  denyBtn: { backgroundColor: colors.errorLight, borderColor: '#FECDD3' },
  actionText: { fontWeight: '600', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.text,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  toastText: { color: colors.white, textAlign: 'center', fontWeight: '600' },
});
