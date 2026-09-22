import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader } from '../src/components/PageHeader';
import { colors, spacing, borderRadius, shadows } from '../src/theme';
import { fetchResidentDues, markResidentDueCollected } from '../src/services/expenses.service';
import { formatMoney } from '../src/utils/money';
import { ResidentDueRow, ResidentDueSummary } from '../src/types';

type Filter = 'all' | 'pending' | 'paid';

const now = new Date();

function firstParam(value?: string | string[]): string {
  if (!value) return '';
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

export default function ResidentDuesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ year?: string; month?: string; buildingId?: string }>();

  const year = Number(firstParam(params.year)) || now.getFullYear();
  const month = Number(firstParam(params.month)) || now.getMonth() + 1;
  const buildingId = firstParam(params.buildingId);

  const [monthLabel, setMonthLabel] = useState('');
  const [canManage, setCanManage] = useState(false);
  const [summary, setSummary] = useState<ResidentDueSummary | null>(null);
  const [residents, setResidents] = useState<ResidentDueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchResidentDues({ year, month, buildingId: buildingId || undefined });
      setMonthLabel(data.monthLabel);
      setCanManage(data.canManage);
      setSummary(data.summary);
      setResidents(data.residents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month, buildingId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleToggle = async (row: ResidentDueRow) => {
    if (!canManage) return;
    setTogglingId(row.id);
    try {
      const next = await markResidentDueCollected({
        year,
        month,
        userId: row.id,
        collected: !row.collected,
        buildingId: buildingId || undefined,
      });
      setSummary(next);
      setResidents((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                collected: !row.collected,
                dueAmount: !row.collected ? 0 : next.amount,
                collectedAt: !row.collected ? new Date().toISOString() : undefined,
              }
            : item,
        ),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return residents.filter((row) => {
      if (filter === 'paid' && !row.collected) return false;
      if (filter === 'pending' && row.collected) return false;
      if (!term) return true;
      return (
        row.name.toLowerCase().includes(term) ||
        (row.unitNumber ?? '').toLowerCase().includes(term)
      );
    });
  }, [residents, search, filter]);

  const progress =
    summary && summary.residentCount > 0
      ? Math.min(100, (summary.collectedCount / summary.residentCount) * 100)
      : 0;

  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: `All (${residents.length})` },
    { key: 'pending', label: `Pending (${residents.filter((r) => !r.collected).length})` },
    { key: 'paid', label: `Paid (${residents.filter((r) => r.collected).length})` },
  ];

  return (
    <View style={styles.root}>
      <PageHeader title="Collections" onBack={() => router.back()}>
        <Text style={styles.subtitle}>
          {monthLabel || 'This month'}
          {summary?.isSet ? ` · ${formatMoney(summary.amount)} per resident` : ' · No due set'}
        </Text>
      </PageHeader>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>
            {summary ? `${summary.collectedCount} / ${summary.residentCount}` : '—'}
          </Text>
          <Text style={styles.summaryMeta}>
            {summary
              ? `${formatMoney(summary.collectedTotal)} of ${formatMoney(summary.expectedTotal)}`
              : ''}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or unit"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setFilter(item.key)}
            style={[styles.chip, filter === item.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && !residents.length ? <Text style={styles.muted}>Loading residents…</Text> : null}
        {!loading && !visible.length ? (
          <Text style={styles.muted}>No residents match this filter.</Text>
        ) : null}

        {visible.map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={[styles.avatar, row.collected && styles.avatarPaid]}>
              <Ionicons
                name={row.collected ? 'checkmark' : 'person'}
                size={18}
                color={row.collected ? colors.success : colors.textMuted}
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={styles.meta}>
                {row.unitNumber ? `Unit ${row.unitNumber} · ` : ''}
                {row.collected ? 'Collected' : `Due ${formatMoney(row.dueAmount)}`}
              </Text>
            </View>

            {canManage ? (
              <Pressable
                onPress={() => void handleToggle(row)}
                disabled={togglingId === row.id}
                style={[styles.action, row.collected && styles.actionDone]}
              >
                {togglingId === row.id ? (
                  <ActivityIndicator size="small" color={row.collected ? colors.success : colors.primary} />
                ) : (
                  <Text style={[styles.actionText, row.collected && styles.actionTextDone]}>
                    {row.collected ? 'Undo' : 'Mark paid'}
                  </Text>
                )}
              </Pressable>
            ) : (
              <View style={[styles.badge, row.collected && styles.badgePaid]}>
                <Text style={[styles.badgeText, row.collected && styles.badgeTextPaid]}>
                  {row.collected ? 'Paid' : 'Pending'}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

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
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  summaryCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  summaryMeta: { fontSize: 12, color: colors.textSecondary },
  track: { height: 8, backgroundColor: colors.slate100, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.success },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.white },
  content: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPaid: { backgroundColor: colors.successLight },
  info: { flex: 1 },
  name: { fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  action: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryLight,
  },
  actionDone: { borderColor: colors.success, backgroundColor: colors.successLight },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  actionTextDone: { color: colors.success },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
  },
  badgePaid: { backgroundColor: colors.successLight },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  badgeTextPaid: { color: colors.success },
  muted: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  error: { color: colors.error, fontSize: 13, textAlign: 'center', marginBottom: spacing.md },
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
